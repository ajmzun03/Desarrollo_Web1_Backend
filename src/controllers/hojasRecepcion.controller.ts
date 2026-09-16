import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';

export const HojasRecepcionController = {
  async getAll(sucursalId?: number) {
    try {
      let hojas;
      if (sucursalId) {
        hojas = await HojaRecepcionModel.getBySucursalId(sucursalId);
      } else {
        hojas = await HojaRecepcionModel.getAll();
      }
      return { data: hojas, error: null, status: 200 };
    } catch (error) {
      console.error('Error get hojas-recepcion:', error);
      return { data: null, error: 'Error al obtener hojas de recepción', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const hoja = await HojaRecepcionModel.getById(id);
      if (!hoja) {
        return { data: null, error: 'Hoja de recepción no encontrada', status: 404 };
      }
      const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(id);
      return { data: { ...hoja, detalles }, error: null, status: 200 };
    } catch (error) {
      console.error('Error get hoja-recepcion:', error);
      return { data: null, error: 'Error al obtener hoja de recepción', status: 500 };
    }
  },

  async create(data: { sucursal_receptora: number; orden_compra_id?: number; tipo_recepcion?: string; items: Array<{ materia_prima_id: number; cantidad_recibida: number; fecha_vencimiento: string; merma?: number }> }) {
    try {
      if (!data.sucursal_receptora || !data.items || !Array.isArray(data.items)) {
        return { data: null, error: 'sucursal_receptora y items son requeridos', status: 400 };
      }
      const nuevaHoja = await HojaRecepcionModel.create({
        sucursal_receptora: data.sucursal_receptora,
        orden_compra_id: data.orden_compra_id,
        tipo_recepcion: data.tipo_recepcion || 'TOTAL'
      });
      for (const item of data.items) {
        const saldo = item.cantidad_recibida - (item.merma || 0);
        const detalle = await HojaRecepcionDetalleModel.create({
          hoja_recepcion_id: Number(nuevaHoja.id),
          materia_prima_id: item.materia_prima_id,
          cantidad_recibida: item.cantidad_recibida,
          fecha_vencimiento: item.fecha_vencimiento,
          merma: item.merma || 0,
          saldo: saldo,
          estado: saldo > 0 ? 'COMPLETA' : 'INCOMPLETA'
        });
        const lote = await LoteMateriaPrimaModel.create({
          materia_prima_id: item.materia_prima_id,
          fecha_vencimiento: item.fecha_vencimiento,
          cantidad_inicial: saldo,
          cantidad_actual: saldo,
          estado: 'VIGENTE'
        });
        await KardexBodegaModel.create({
          bodega_id: data.sucursal_receptora,
          lote_id: Number(lote.id),
          tipo_movimiento: 'INGRESO',
          cantidad: saldo
        });
      }
      const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(Number(nuevaHoja.id));
      return { data: { ...nuevaHoja, detalles }, error: null, status: 201 };
    } catch (error) {
      console.error('Error create hoja-recepcion:', error);
      return { data: null, error: 'Error al crear hoja de recepción', status: 500 };
    }
  }
};