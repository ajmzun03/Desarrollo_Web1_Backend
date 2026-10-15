import { db } from '../model/supabase/db.model.js';
import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import type { SelectHojaRecepcion, SelectHojaRecepcionDetalle } from '../schemas/db.schema.js';

export interface CrearHojaRecepcionInput {
  sucursal_receptora: number;
  orden_compra_id?: number;
  tipo_recepcion?: 'TOTAL' | 'PARCIAL';
  items: Array<{ materia_prima_id: number; cantidad_recibida: number; fecha_vencimiento: string; merma?: number }>;
}

export async function crearHojaRecepcion(input: CrearHojaRecepcionInput): Promise<SelectHojaRecepcion & { detalles: SelectHojaRecepcionDetalle[] }> {
  return db.transaction(async (tx) => {
    const nuevaHoja = await HojaRecepcionModel.create({
      sucursal_receptora: input.sucursal_receptora,
      orden_compra_id: input.orden_compra_id,
      tipo_recepcion: input.tipo_recepcion || 'TOTAL'
    }, tx);

    for (const item of input.items) {
      const saldo = item.cantidad_recibida - (item.merma || 0);
      await HojaRecepcionDetalleModel.create({
        hoja_recepcion_id: Number(nuevaHoja.id),
        materia_prima_id: item.materia_prima_id,
        cantidad_recibida: String(item.cantidad_recibida),
        fecha_vencimiento: item.fecha_vencimiento,
        merma: String(item.merma || 0),
        saldo: String(saldo),
        estado: saldo > 0 ? 'COMPLETA' : 'INCOMPLETA'
      }, tx);

      const lote = await LoteMateriaPrimaModel.create({
        materia_prima_id: item.materia_prima_id,
        fecha_vencimiento: item.fecha_vencimiento,
        cantidad_inicial: String(saldo),
        cantidad_actual: String(saldo),
        estado: 'VIGENTE'
      }, tx);

      await KardexBodegaModel.create({
        bodega_id: input.sucursal_receptora,
        lote_id: Number(lote.id),
        tipo_movimiento: 'INGRESO',
        cantidad: String(saldo)
      }, tx);
    }

    const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(Number(nuevaHoja.id));
    return { ...nuevaHoja, detalles };
  });
}
