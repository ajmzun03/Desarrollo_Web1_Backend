import { and, asc, eq, gt, gte } from 'drizzle-orm';
import { db, type Tx } from '../model/supabase/db.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
import {
  alacenaTable,
  bodegaTable,
  kardexAlacenaTable,
  loteMateriaPrimaTable,
  stockAlacenaTable,
  stockBodegaTable,
  kardexBodegaTable
} from '../schemas/db.schema.js';
import { ErrorNegocio } from '../utils/errors.js';

export interface TrasladoInput {
  bodega_origen_id: number;
  bodega_destino_id: number;
  lote_id: number;
  cantidad: number;
}

export interface IngresoValeInput {
  bodega_id: number;
  materia_prima_id: number;
  cantidad: number;
  fecha_vencimiento: string;
  descripcion?: string | undefined;
  gasto?: { sucursal_id: number; caja_id?: number | undefined; usuario_id?: number | undefined; monto: number } | undefined;
}

export interface CuadreInput {
  bodega_id: number;
  items: Array<{ lote_id: number; cantidad_fisica: number }>;
}

export interface TrasladoAlacenaInput {
  bodega_id: number;
  alacena_id: number;
  lote_id: number;
  cantidad: number;
}

export interface MermaAlacenaInput {
  alacena_id: number;
  lote_id: number;
  cantidad: number;
  tipo?: 'SALIDA' | 'MERMA' | 'VENCIMIENTO' | 'TRASLADO' | undefined;
}

export interface ConsumoInput {
  sucursal_id: number;
  materia_prima_id: number;
  cantidad: number;
}

/** Redondea a 2 decimales (las cantidades son numeric(10,2)). */
const redondear = (n: number): number => Math.round(n * 100) / 100;

function validarCantidad(cantidad: number): void {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new ErrorNegocio('La cantidad debe ser mayor a 0', 400);
  }
}

// ---------------------------------------------------------------------------
// Consumo FEFO (producción)
// ---------------------------------------------------------------------------

export interface CandidatoConsumo {
  lote_id: number;
  cantidad: number;
  origen: 'alacena' | 'bodega';
  origen_id: number;
}

/**
 * Reparte `requerido` entre los candidatos EN EL ORDEN RECIBIDO (se espera FEFO).
 * Lanza ErrorNegocio 409 si no alcanza el stock. Función pura, sin acceso a BD.
 */
export function planificarConsumo(
  candidatos: CandidatoConsumo[],
  requerido: number
): Array<CandidatoConsumo & { tomar: number }> {
  let pendiente = redondear(requerido);
  const plan: Array<CandidatoConsumo & { tomar: number }> = [];
  for (const c of candidatos) {
    if (pendiente <= 0) break;
    const tomar = Math.min(pendiente, c.cantidad);
    if (tomar <= 0) continue;
    plan.push({ ...c, tomar: redondear(tomar) });
    pendiente = redondear(pendiente - tomar);
  }
  if (pendiente > 0) {
    throw new ErrorNegocio(`Stock insuficiente: faltan ${pendiente} de la materia prima`, 409);
  }
  return plan;
}

/**
 * Descuenta `cantidad` de una materia prima en una sucursal: primero de sus alacenas y luego de
 * sus bodegas, por fecha de vencimiento (FEFO), sin tocar lotes vencidos. Bloquea los lotes
 * (FOR UPDATE) y registra la SALIDA en el kardex. Debe llamarse dentro de una transacción.
 */
export async function consumirMateriaPrima(tx: Tx, input: ConsumoInput) {
  validarCantidad(input.cantidad);
  const hoy = new Date().toISOString().slice(0, 10);

  const filtroLote = and(
    eq(loteMateriaPrimaTable.materia_prima_id, input.materia_prima_id),
    eq(loteMateriaPrimaTable.estado, 'VIGENTE'),
    gt(loteMateriaPrimaTable.cantidad_actual, '0'),
    gte(loteMateriaPrimaTable.fecha_vencimiento, hoy)
  );

  const enAlacenas = await tx
    .select({ lote: loteMateriaPrimaTable, origen_id: stockAlacenaTable.alacena_id })
    .from(stockAlacenaTable)
    .innerJoin(loteMateriaPrimaTable, eq(loteMateriaPrimaTable.id, stockAlacenaTable.lote_id))
    .innerJoin(alacenaTable, eq(alacenaTable.id, stockAlacenaTable.alacena_id))
    .innerJoin(bodegaTable, eq(bodegaTable.id, alacenaTable.bodega_id))
    .where(and(eq(bodegaTable.sucursal_id, input.sucursal_id), filtroLote))
    .orderBy(asc(loteMateriaPrimaTable.fecha_vencimiento), asc(loteMateriaPrimaTable.id))
    .for('update', { of: loteMateriaPrimaTable });

  const enBodegas = await tx
    .select({ lote: loteMateriaPrimaTable, origen_id: stockBodegaTable.bodega_id })
    .from(stockBodegaTable)
    .innerJoin(loteMateriaPrimaTable, eq(loteMateriaPrimaTable.id, stockBodegaTable.lote_id))
    .innerJoin(bodegaTable, eq(bodegaTable.id, stockBodegaTable.bodega_id))
    .where(and(eq(bodegaTable.sucursal_id, input.sucursal_id), filtroLote))
    .orderBy(asc(loteMateriaPrimaTable.fecha_vencimiento), asc(loteMateriaPrimaTable.id))
    .for('update', { of: loteMateriaPrimaTable });

  const candidatos: CandidatoConsumo[] = [
    ...enAlacenas.map(r => ({
      lote_id: Number(r.lote.id), cantidad: Number(r.lote.cantidad_actual), origen: 'alacena' as const, origen_id: Number(r.origen_id)
    })),
    ...enBodegas.map(r => ({
      lote_id: Number(r.lote.id), cantidad: Number(r.lote.cantidad_actual), origen: 'bodega' as const, origen_id: Number(r.origen_id)
    }))
  ];

  const plan = planificarConsumo(candidatos, input.cantidad);

  // Un mismo lote podría estar en más de un lugar: se descuenta sobre el saldo ya modificado.
  const saldos = new Map<number, number>(candidatos.map(c => [c.lote_id, c.cantidad]));
  for (const paso of plan) {
    const saldoActual = saldos.get(paso.lote_id) ?? 0;
    const restante = redondear(saldoActual - paso.tomar);
    if (restante < 0) {
      throw new ErrorNegocio('Stock insuficiente: el lote cambió durante la operación', 409);
    }
    saldos.set(paso.lote_id, restante);

    await tx.update(loteMateriaPrimaTable)
      .set({ cantidad_actual: restante.toFixed(2), ...(restante === 0 ? { estado: 'AGOTADO' as const } : {}) })
      .where(eq(loteMateriaPrimaTable.id, paso.lote_id));

    if (paso.origen === 'alacena') {
      await tx.insert(kardexAlacenaTable).values({
        alacena_id: paso.origen_id, lote_id: paso.lote_id, tipo_movimiento: 'SALIDA', cantidad: paso.tomar.toFixed(2)
      });
    } else {
      await tx.insert(kardexBodegaTable).values({
        bodega_id: paso.origen_id, lote_id: paso.lote_id, tipo_movimiento: 'SALIDA', cantidad: paso.tomar.toFixed(2)
      });
    }
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Bodega
// ---------------------------------------------------------------------------

export async function traslado(input: TrasladoInput) {
  validarCantidad(input.cantidad);
  return db.transaction(async (tx) => {
    if (input.bodega_origen_id === input.bodega_destino_id) {
      throw new ErrorNegocio('La bodega de origen y destino deben ser diferentes', 400);
    }
    const stockOrigen = await StockBodegaModel.getByBodegaAndLote(input.bodega_origen_id, input.lote_id, tx);
    if (!stockOrigen) {
      throw new ErrorNegocio('El lote no se encuentra en la bodega de origen', 404);
    }
    // FOR UPDATE: evita que dos traslados simultáneos descuenten el mismo saldo
    const lote = await LoteMateriaPrimaModel.getById(input.lote_id, tx, true);
    if (!lote) {
      throw new ErrorNegocio('Lote no encontrado', 404);
    }
    if (lote.estado !== 'VIGENTE') {
      throw new ErrorNegocio(`El lote está ${lote.estado}; solo se trasladan lotes VIGENTES`, 409);
    }
    const cantidadActual = Number(lote.cantidad_actual);
    if (input.cantidad > cantidadActual) {
      throw new ErrorNegocio(`Cantidad a trasladar (${input.cantidad}) mayor al disponible (${cantidadActual})`, 400);
    }

    const restante = redondear(cantidadActual - input.cantidad);
    await LoteMateriaPrimaModel.update(input.lote_id, {
      cantidad_actual: String(restante),
      estado: restante === 0 ? ('AGOTADO' as any) : lote.estado
    }, tx);

    const loteDestino = await LoteMateriaPrimaModel.create({
      materia_prima_id: lote.materia_prima_id,
      fecha_vencimiento: lote.fecha_vencimiento,
      cantidad_inicial: String(input.cantidad),
      cantidad_actual: String(input.cantidad),
      estado: 'VIGENTE'
    }, tx);

    const stockDestino = await StockBodegaModel.getByBodegaAndLote(input.bodega_destino_id, Number(loteDestino.id), tx);
    if (!stockDestino) {
      await StockBodegaModel.create({ bodega_id: input.bodega_destino_id, lote_id: Number(loteDestino.id) }, tx);
    }

    await KardexBodegaModel.create({
      bodega_id: input.bodega_origen_id,
      lote_id: input.lote_id,
      tipo_movimiento: 'TRASLADO',
      cantidad: String(input.cantidad)
    }, tx);
    await KardexBodegaModel.create({
      bodega_id: input.bodega_destino_id,
      lote_id: Number(loteDestino.id),
      tipo_movimiento: 'TRASLADO',
      cantidad: String(input.cantidad)
    }, tx);

    return {
      lote_origen_id: input.lote_id,
      lote_destino_id: Number(loteDestino.id),
      bodega_origen_id: input.bodega_origen_id,
      bodega_destino_id: input.bodega_destino_id,
      cantidad_trasladada: input.cantidad,
      saldo_origen: restante
    };
  });
}

export async function ingresoVale(input: IngresoValeInput) {
  validarCantidad(input.cantidad);
  return db.transaction(async (tx) => {
    const lote = await LoteMateriaPrimaModel.create({
      materia_prima_id: input.materia_prima_id,
      fecha_vencimiento: input.fecha_vencimiento,
      cantidad_inicial: String(input.cantidad),
      cantidad_actual: String(input.cantidad),
      estado: 'VIGENTE'
    }, tx);

    // El lote debe quedar registrado en la bodega; si no, no aparece en stock ni se puede trasladar
    await StockBodegaModel.create({ bodega_id: input.bodega_id, lote_id: Number(lote.id) }, tx);

    await KardexBodegaModel.create({
      bodega_id: input.bodega_id,
      lote_id: Number(lote.id),
      tipo_movimiento: 'INGRESO',
      cantidad: String(input.cantidad)
    }, tx);

    let gasto = null;
    if (input.gasto) {
      const ahora = new Date().toISOString();
      // Gasto puntual: se registra como cierre ya declarado y validado (sin apertura)
      gasto = await GastosSucursalModel.create({
        sucursal_id: input.gasto.sucursal_id,
        caja_id: input.gasto.caja_id,
        usuario_id: input.gasto.usuario_id,
        monto_apertura: '0',
        monto_cierre_declarado: String(input.gasto.monto),
        monto_cierre_sistema: String(input.gasto.monto),
        abierto_en: ahora,
        cerrado_en: ahora
      }, tx);
    }

    return { lote, gasto, descripcion: input.descripcion ?? null };
  });
}

export async function cuadre(input: CuadreInput) {
  const repetidos = new Set<number>();
  for (const item of input.items) {
    if (repetidos.has(item.lote_id)) {
      throw new ErrorNegocio(`El lote ${item.lote_id} está repetido en el cuadre`, 400);
    }
    repetidos.add(item.lote_id);
  }

  return db.transaction(async (tx) => {
    const resultados: Array<Record<string, any>> = [];
    for (const item of input.items) {
      const enBodega = await StockBodegaModel.getByBodegaAndLote(input.bodega_id, item.lote_id, tx);
      if (!enBodega) {
        throw new ErrorNegocio(`Lote ${item.lote_id} no se encuentra en la bodega ${input.bodega_id}`, 404);
      }
      const lote = await LoteMateriaPrimaModel.getById(item.lote_id, tx, true);
      if (!lote) {
        throw new ErrorNegocio(`Lote ${item.lote_id} no encontrado`, 404);
      }
      const cantidadSistema = Number(lote.cantidad_actual);
      const diferencia = redondear(item.cantidad_fisica - cantidadSistema);

      if (diferencia !== 0) {
        await LoteMateriaPrimaModel.update(item.lote_id, {
          cantidad_actual: String(item.cantidad_fisica),
          estado: item.cantidad_fisica === 0 ? ('AGOTADO' as any) : lote.estado
        }, tx);
        await KardexBodegaModel.create({
          bodega_id: input.bodega_id,
          lote_id: item.lote_id,
          tipo_movimiento: diferencia < 0 ? 'MERMA' : 'INGRESO',
          cantidad: String(Math.abs(diferencia))
        }, tx);
      }

      resultados.push({
        lote_id: item.lote_id,
        cantidad_sistema: cantidadSistema,
        cantidad_fisica: item.cantidad_fisica,
        diferencia
      });
    }
    return { bodega_id: input.bodega_id, ajustes: resultados };
  });
}

// ---------------------------------------------------------------------------
// Alacena
// ---------------------------------------------------------------------------

/** Traslada una cantidad de un lote de una bodega a una alacena de esa misma bodega. */
export async function trasladoAAlacena(input: TrasladoAlacenaInput) {
  validarCantidad(input.cantidad);
  return db.transaction(async (tx) => {
    const [alacena] = await tx.select().from(alacenaTable).where(eq(alacenaTable.id, input.alacena_id)).limit(1);
    if (!alacena) throw new ErrorNegocio('Alacena no encontrada', 404);
    if (Number(alacena.bodega_id) !== input.bodega_id) {
      throw new ErrorNegocio('La alacena no pertenece a la bodega indicada', 400);
    }

    const enBodega = await StockBodegaModel.getByBodegaAndLote(input.bodega_id, input.lote_id, tx);
    if (!enBodega) throw new ErrorNegocio('El lote no se encuentra en la bodega de origen', 404);

    const lote = await LoteMateriaPrimaModel.getById(input.lote_id, tx, true);
    if (!lote) throw new ErrorNegocio('Lote no encontrado', 404);
    if (lote.estado !== 'VIGENTE') {
      throw new ErrorNegocio(`El lote está ${lote.estado}; solo se trasladan lotes VIGENTES`, 409);
    }
    const disponible = Number(lote.cantidad_actual);
    if (input.cantidad > disponible) {
      throw new ErrorNegocio(`Cantidad a trasladar (${input.cantidad}) mayor al disponible (${disponible})`, 400);
    }

    const restante = redondear(disponible - input.cantidad);
    await LoteMateriaPrimaModel.update(input.lote_id, {
      cantidad_actual: String(restante),
      estado: restante === 0 ? ('AGOTADO' as any) : lote.estado
    }, tx);

    const loteAlacena = await LoteMateriaPrimaModel.create({
      materia_prima_id: lote.materia_prima_id,
      fecha_vencimiento: lote.fecha_vencimiento,
      cantidad_inicial: String(input.cantidad),
      cantidad_actual: String(input.cantidad),
      estado: 'VIGENTE'
    }, tx);

    await tx.insert(stockAlacenaTable).values({ alacena_id: input.alacena_id, lote_id: Number(loteAlacena.id) });
    await KardexBodegaModel.create({
      bodega_id: input.bodega_id, lote_id: input.lote_id, tipo_movimiento: 'TRASLADO', cantidad: String(input.cantidad)
    }, tx);
    await tx.insert(kardexAlacenaTable).values({
      alacena_id: input.alacena_id, lote_id: Number(loteAlacena.id), tipo_movimiento: 'TRASLADO', cantidad: String(input.cantidad)
    });

    return {
      lote_origen_id: input.lote_id,
      lote_alacena_id: Number(loteAlacena.id),
      alacena_id: input.alacena_id,
      cantidad_trasladada: input.cantidad,
      saldo_origen: restante
    };
  });
}

/** Registra merma/vencimiento/salida de un lote que está en una alacena. */
export async function mermaAlacena(input: MermaAlacenaInput) {
  validarCantidad(input.cantidad);
  return db.transaction(async (tx) => {
    const [enAlacena] = await tx.select().from(stockAlacenaTable)
      .where(and(eq(stockAlacenaTable.alacena_id, input.alacena_id), eq(stockAlacenaTable.lote_id, input.lote_id)))
      .limit(1);
    if (!enAlacena) throw new ErrorNegocio('El lote no se encuentra en la alacena indicada', 404);

    const lote = await LoteMateriaPrimaModel.getById(input.lote_id, tx, true);
    if (!lote) throw new ErrorNegocio('Lote no encontrado', 404);

    const cantidadActual = Number(lote.cantidad_actual);
    if (input.cantidad > cantidadActual) {
      throw new ErrorNegocio(`Cantidad (${input.cantidad}) mayor al disponible (${cantidadActual})`, 400);
    }

    const restante = redondear(cantidadActual - input.cantidad);
    const tipo = input.tipo ?? 'MERMA';
    let estado = lote.estado;
    if (tipo === 'VENCIMIENTO') estado = 'VENCIDO';
    else if (restante === 0) estado = 'AGOTADO';

    await LoteMateriaPrimaModel.update(input.lote_id, { cantidad_actual: String(restante), estado }, tx);
    const [movimiento] = await tx.insert(kardexAlacenaTable).values({
      alacena_id: input.alacena_id,
      lote_id: input.lote_id,
      tipo_movimiento: tipo,
      cantidad: String(input.cantidad)
    }).returning();

    return { movimiento, saldo_restante: restante };
  });
}
