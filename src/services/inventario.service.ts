import { db } from '../model/supabase/db.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';

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
  descripcion?: string;
  gasto?: { sucursal_id: number; caja_id?: number; usuario_id?: number; monto: number };
}

export interface CuadreInput {
  bodega_id: number;
  items: Array<{ lote_id: number; cantidad_fisica: number }>;
}

export async function traslado(input: TrasladoInput) {
  return db.transaction(async (tx) => {
    if (input.bodega_origen_id === input.bodega_destino_id) {
      throw new Error('La bodega de origen y destino deben ser diferentes');
    }
    const stockOrigen = await StockBodegaModel.getByBodegaAndLote(input.bodega_origen_id, input.lote_id, tx);
    if (!stockOrigen) {
      throw new Error('El lote no se encuentra en la bodega de origen');
    }
    const lote = await LoteMateriaPrimaModel.getById(input.lote_id, tx);
    if (!lote) {
      throw new Error('Lote no encontrado');
    }
    const cantidadActual = Number(lote.cantidad_actual);
    if (input.cantidad > cantidadActual) {
      throw new Error(`Cantidad a trasladar (${input.cantidad}) mayor al disponible (${cantidadActual})`);
    }

    const restante = cantidadActual - input.cantidad;
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
  return db.transaction(async (tx) => {
    const lote = await LoteMateriaPrimaModel.create({
      materia_prima_id: input.materia_prima_id,
      fecha_vencimiento: input.fecha_vencimiento,
      cantidad_inicial: String(input.cantidad),
      cantidad_actual: String(input.cantidad),
      estado: 'VIGENTE'
    }, tx);

    await KardexBodegaModel.create({
      bodega_id: input.bodega_id,
      lote_id: Number(lote.id),
      tipo_movimiento: 'INGRESO',
      cantidad: String(input.cantidad)
    }, tx);

    let gasto = null;
    if (input.gasto) {
      gasto = await GastosSucursalModel.create({
        sucursal_id: input.gasto.sucursal_id,
        caja_id: input.gasto.caja_id,
        usuario_id: input.gasto.usuario_id,
        monto_apertura: String(input.gasto.monto),
        monto_cierre_declarado: String(input.gasto.monto),
        monto_cierre_sistema: String(input.gasto.monto)
      }, tx);
    }

    return { lote, gasto, descripcion: input.descripcion ?? null };
  });
}

export async function cuadre(input: CuadreInput) {
  return db.transaction(async (tx) => {
    const resultados: Array<Record<string, any>> = [];
    for (const item of input.items) {
      const lote = await LoteMateriaPrimaModel.getById(item.lote_id, tx);
      if (!lote) {
        throw new Error(`Lote ${item.lote_id} no encontrado`);
      }
      const cantidadSistema = Number(lote.cantidad_actual);
      const diferencia = item.cantidad_fisica - cantidadSistema;

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
