import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { crearHojaRecepcion, type CrearHojaRecepcionInput } from '../services/recepcion.service.js';

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
      logger.error({ err: error }, 'Error get hojas-recepcion:');
      return errorDb(error, 'Error al obtener hojas de recepción');
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
      logger.error({ err: error }, 'Error get hoja-recepcion:');
      return errorDb(error, 'Error al obtener hoja de recepción');
    }
  },

  async create(data: CrearHojaRecepcionInput) {
    try {
      if (!data.sucursal_receptora || !data.bodega_id || !data.items || !Array.isArray(data.items)) {
        return { data: null, error: 'sucursal_receptora, bodega_id e items son requeridos', status: 400 };
      }
      const nuevaHoja = await crearHojaRecepcion(data);
      return { data: nuevaHoja, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create hoja-recepcion:');
      return errorDb(error, 'Error al crear hoja de recepción');
    }
  }
};