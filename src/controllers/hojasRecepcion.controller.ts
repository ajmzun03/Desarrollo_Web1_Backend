import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import logger from '../config/logger.js';
import { crearHojaRecepcion } from '../services/recepcion.service.js';

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
      logger.error({ error }, 'Error get hojas-recepcion:');
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
      logger.error({ error }, 'Error get hoja-recepcion:');
      return { data: null, error: 'Error al obtener hoja de recepción', status: 500 };
    }
  },

  async create(data: { sucursal_receptora: number; orden_compra_id?: number; tipo_recepcion?: 'TOTAL' | 'PARCIAL'; items: Array<{ materia_prima_id: number; cantidad_recibida: number; fecha_vencimiento: string; merma?: number }> }) {
    try {
      if (!data.sucursal_receptora || !data.items || !Array.isArray(data.items)) {
        return { data: null, error: 'sucursal_receptora y items son requeridos', status: 400 };
      }
      const nuevaHoja = await crearHojaRecepcion(data);
      return { data: nuevaHoja, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create hoja-recepcion:');
      return { data: null, error: 'Error al crear hoja de recepción', status: 500 };
    }
  }
};