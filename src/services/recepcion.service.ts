import { db } from '../model/supabase/db.model.js';
import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import type { SelectHojaRecepcion, SelectHojaRecepcionDetalle } from '../schemas/db.schema.js';
import { cargarBodega, cargarOrdenConDetalles, finalizarOrden } from './recepcion.repo.js';
import { ErrorNegocio } from '../utils/errors.js';

export interface CrearHojaRecepcionInput {
  sucursal_receptora: number;
  /** Bodega donde queda físicamente el producto; debe pertenecer a la sucursal receptora. */
  bodega_id: number;
  orden_compra_id?: number | undefined;
  tipo_recepcion?: 'TOTAL' | 'PARCIAL' | undefined;
  items: Array<{ materia_prima_id: number; cantidad_recibida: number; fecha_vencimiento: string; merma?: number | undefined }>;
}

export async function crearHojaRecepcion(input: CrearHojaRecepcionInput): Promise<SelectHojaRecepcion & { detalles: SelectHojaRecepcionDetalle[] }> {
  return db.transaction(async (tx) => {
    const bodega = await cargarBodega(tx, input.bodega_id);
    if (!bodega) throw new ErrorNegocio('Bodega no encontrada', 404);
    if (Number(bodega.sucursal_id) !== input.sucursal_receptora) {
      throw new ErrorNegocio('La bodega no pertenece a la sucursal receptora', 400);
    }

    const tipo = input.tipo_recepcion || 'TOTAL';

    // Si la recepción responde a una orden de compra, debe estar programada y ser para esta sucursal
    if (input.orden_compra_id) {
      const contexto = await cargarOrdenConDetalles(tx, input.orden_compra_id);
      if (!contexto) throw new ErrorNegocio('Orden de compra no encontrada', 404);
      const { orden, detalles } = contexto;
      if (orden.estado_orden !== 'EN_PREPARACION') {
        throw new ErrorNegocio(`La orden de compra está ${orden.estado_orden}; solo se recibe una orden EN_PREPARACION (agendada)`, 409);
      }
      if (Number(orden.sucursal_destino) !== input.sucursal_receptora) {
        throw new ErrorNegocio('La orden de compra es para otra sucursal', 400);
      }
      const pedidas = new Set(detalles.map(d => Number(d.materia_prima_id)));
      for (const item of input.items) {
        if (!pedidas.has(item.materia_prima_id)) {
          throw new ErrorNegocio(`La materia prima ${item.materia_prima_id} no está en la orden de compra`, 400);
        }
      }
    }

    for (const item of input.items) {
      if ((item.merma ?? 0) > item.cantidad_recibida) {
        throw new ErrorNegocio('La merma no puede ser mayor a la cantidad recibida', 400);
      }
    }

    const nuevaHoja = await HojaRecepcionModel.create({
      sucursal_receptora: input.sucursal_receptora,
      orden_compra_id: input.orden_compra_id,
      tipo_recepcion: tipo
    }, tx);

    for (const item of input.items) {
      const saldo = Math.round((item.cantidad_recibida - (item.merma || 0)) * 100) / 100;
      await HojaRecepcionDetalleModel.create({
        hoja_recepcion_id: Number(nuevaHoja.id),
        materia_prima_id: item.materia_prima_id,
        cantidad_recibida: String(item.cantidad_recibida),
        fecha_vencimiento: item.fecha_vencimiento,
        merma: String(item.merma || 0),
        saldo: String(saldo),
        estado: saldo > 0 ? 'COMPLETA' : 'INCOMPLETA'
      }, tx);

      // Si toda la cantidad fue merma no hay nada que almacenar
      if (saldo <= 0) continue;

      const lote = await LoteMateriaPrimaModel.create({
        materia_prima_id: item.materia_prima_id,
        fecha_vencimiento: item.fecha_vencimiento,
        cantidad_inicial: String(saldo),
        cantidad_actual: String(saldo),
        estado: 'VIGENTE'
      }, tx);

      // Sin esta fila el lote no aparece en el stock de la bodega ni puede trasladarse
      await StockBodegaModel.create({ bodega_id: input.bodega_id, lote_id: Number(lote.id) }, tx);

      await KardexBodegaModel.create({
        bodega_id: input.bodega_id,
        lote_id: Number(lote.id),
        tipo_movimiento: 'INGRESO',
        cantidad: String(saldo)
      }, tx);
    }

    // Una recepción TOTAL cierra la orden de compra
    if (input.orden_compra_id && tipo === 'TOTAL') {
      await finalizarOrden(tx, input.orden_compra_id);
    }

    const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(Number(nuevaHoja.id));
    return { ...nuevaHoja, detalles };
  });
}
