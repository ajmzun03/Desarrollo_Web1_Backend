import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import {
  pedidoTable,
  detallePedidoTable,
  hojaDespachoTable,
  hojaDespachoDetalleTable,
  productoLoteTable,
  usuarioTable
} from '../schemas/db.schema.js';
import type { SelectHojaDespacho, SelectHojaDespachoDetalle } from '../schemas/db.schema.js';
import { ErrorNegocio } from '../utils/errors.js';
import { TRANSICIONES_PEDIDO, validarTransicion } from '../utils/transiciones.js';

export interface CrearHojaDespachoInput {
  pedido_id: number;
  sucursal_despacho: number;
  repartidor_id?: number | undefined;
  items: Array<{ producto_lote_id: number; cantidad_despachada: number }>;
}

export interface LoteDespacho { id: number; producto_id: number; cantidad_actual: number; estado: string | null }

const redondear = (n: number): number => Math.round(n * 100) / 100;

/**
 * Valida los ítems de una hoja de despacho contra los lotes y el pedido. Función pura.
 *  - el lote existe, está VIGENTE y alcanza la cantidad (sumando ítems repetidos del mismo lote),
 *  - el producto del lote está en el pedido,
 *  - no se despacha más de lo pedido (contando lo ya despachado en hojas anteriores).
 */
export function validarItemsDespacho(
  items: CrearHojaDespachoInput['items'],
  lotes: Map<number, LoteDespacho>,
  pedido: Array<{ producto_id: number; cantidad: number }>,
  yaDespachado: Map<number, number>
): void {
  const pedidoPorProducto = new Map<number, number>();
  for (const p of pedido) {
    pedidoPorProducto.set(p.producto_id, (pedidoPorProducto.get(p.producto_id) ?? 0) + p.cantidad);
  }

  const usoPorLote = new Map<number, number>();
  const nuevoPorProducto = new Map<number, number>();

  for (const item of items) {
    const lote = lotes.get(item.producto_lote_id);
    if (!lote) throw new ErrorNegocio(`El lote de producto ${item.producto_lote_id} no existe`, 404);
    if (lote.estado !== 'VIGENTE') {
      throw new ErrorNegocio(`El lote de producto ${lote.id} está ${lote.estado}`, 409);
    }
    if (!pedidoPorProducto.has(lote.producto_id)) {
      throw new ErrorNegocio(`El lote ${lote.id} es de un producto que no está en el pedido`, 400);
    }

    const uso = redondear((usoPorLote.get(lote.id) ?? 0) + item.cantidad_despachada);
    if (uso > lote.cantidad_actual) {
      throw new ErrorNegocio(`El lote ${lote.id} solo tiene ${lote.cantidad_actual} disponibles`, 409);
    }
    usoPorLote.set(lote.id, uso);
    nuevoPorProducto.set(lote.producto_id, redondear((nuevoPorProducto.get(lote.producto_id) ?? 0) + item.cantidad_despachada));
  }

  for (const [productoId, nuevo] of nuevoPorProducto) {
    const total = redondear(nuevo + (yaDespachado.get(productoId) ?? 0));
    const pedido_cant = pedidoPorProducto.get(productoId) ?? 0;
    if (total > pedido_cant) {
      throw new ErrorNegocio(`Se despacharían ${total} del producto ${productoId} pero el pedido solo tiene ${pedido_cant}`, 409);
    }
  }
}

/**
 * Crea la hoja de despacho en una transacción: valida pedido/repartidor/lotes, descuenta el
 * stock de producto terminado y avanza el pedido (EN_RUTA a domicilio, EN_DESPACHO si recoge).
 */
export async function crearHojaDespacho(
  input: CrearHojaDespachoInput
): Promise<SelectHojaDespacho & { detalles: SelectHojaDespachoDetalle[] }> {
  return db.transaction(async (tx) => {
    const [pedido] = await tx.select().from(pedidoTable)
      .where(eq(pedidoTable.id, input.pedido_id)).limit(1).for('update');
    if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
    if (pedido.estado !== 'LISTO' && pedido.estado !== 'EN_DESPACHO') {
      throw new ErrorNegocio(`El pedido está ${pedido.estado}; solo se despacha un pedido LISTO`, 409);
    }

    const aDomicilio = pedido.tipo_entrega === 'DOMICILIO';
    if (aDomicilio && !input.repartidor_id) {
      throw new ErrorNegocio('repartidor_id es requerido para pedidos a domicilio', 400);
    }
    if (input.repartidor_id) {
      const [repartidor] = await tx.select().from(usuarioTable)
        .where(eq(usuarioTable.id, input.repartidor_id)).limit(1);
      if (!repartidor || repartidor.rol !== 'REPARTIDOR') {
        throw new ErrorNegocio('El repartidor no existe o no tiene rol REPARTIDOR', 400);
      }
      if (!repartidor.activo) throw new ErrorNegocio('El repartidor está desactivado', 409);
    }

    const loteIds = [...new Set(input.items.map(i => i.producto_lote_id))];
    const lotesBD = await tx.select().from(productoLoteTable)
      .where(inArray(productoLoteTable.id, loteIds)).orderBy(productoLoteTable.id).for('update');
    const lotes = new Map<number, LoteDespacho>(lotesBD.map(l => [Number(l.id), {
      id: Number(l.id), producto_id: Number(l.producto_id), cantidad_actual: Number(l.cantidad_actual ?? 0), estado: l.estado
    }]));

    const detallesPedido = await tx.select().from(detallePedidoTable)
      .where(eq(detallePedidoTable.pedido_id, input.pedido_id));

    // Lo ya despachado en hojas anteriores de este pedido, por producto
    const previos = await tx
      .select({ producto_id: productoLoteTable.producto_id, cantidad: hojaDespachoDetalleTable.cantidad_despachada })
      .from(hojaDespachoDetalleTable)
      .innerJoin(hojaDespachoTable, eq(hojaDespachoTable.id, hojaDespachoDetalleTable.hoja_despacho_id))
      .innerJoin(productoLoteTable, eq(productoLoteTable.id, hojaDespachoDetalleTable.producto_lote_id))
      .where(eq(hojaDespachoTable.pedido_id, input.pedido_id));
    const yaDespachado = new Map<number, number>();
    for (const p of previos) {
      yaDespachado.set(Number(p.producto_id), redondear((yaDespachado.get(Number(p.producto_id)) ?? 0) + Number(p.cantidad)));
    }

    validarItemsDespacho(
      input.items,
      lotes,
      detallesPedido.map(d => ({ producto_id: Number(d.producto_id), cantidad: Number(d.cantidad) })),
      yaDespachado
    );

    const [hoja] = await tx.insert(hojaDespachoTable).values({
      pedido_id: input.pedido_id,
      sucursal_despacho: input.sucursal_despacho,
      repartidor_id: input.repartidor_id,
      despachado_en: new Date().toISOString()
    }).returning();
    if (!hoja) throw new Error('Error al crear la hoja de despacho');

    const saldos = new Map<number, number>([...lotes.entries()].map(([id, l]) => [id, l.cantidad_actual]));
    const detalles: SelectHojaDespachoDetalle[] = [];
    for (const item of input.items) {
      const [detalle] = await tx.insert(hojaDespachoDetalleTable).values({
        hoja_despacho_id: Number(hoja.id),
        producto_lote_id: item.producto_lote_id,
        cantidad_despachada: String(item.cantidad_despachada)
      }).returning();
      if (!detalle) throw new Error('Error al crear el detalle de la hoja de despacho');
      detalles.push(detalle);

      const restante = redondear((saldos.get(item.producto_lote_id) ?? 0) - item.cantidad_despachada);
      saldos.set(item.producto_lote_id, restante);
      await tx.update(productoLoteTable)
        .set({ cantidad_actual: restante.toFixed(2), ...(restante === 0 ? { estado: 'AGOTADO' as const } : {}) })
        .where(and(eq(productoLoteTable.id, item.producto_lote_id)));
    }

    const siguiente = aDomicilio ? 'EN_RUTA' : 'EN_DESPACHO';
    // Una segunda hoja de un pedido ya EN_DESPACHO (despacho parcial) no cambia el estado
    if (pedido.estado !== siguiente) {
      validarTransicion(TRANSICIONES_PEDIDO, pedido.estado, siguiente, 'el pedido');
      await tx.update(pedidoTable).set({ estado: siguiente }).where(eq(pedidoTable.id, input.pedido_id));
    }

    return { ...hoja, detalles };
  });
}
