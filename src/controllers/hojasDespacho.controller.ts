import { HojaDespachoModel, HojaDespachoDetalleModel } from '../model/supabase/hojaDespacho.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { crearHojaDespacho, type CrearHojaDespachoInput } from '../services/despacho.service.js';

export const HojasDespachoController = {
  async getAll() {
    try {
      const hojas = await HojaDespachoModel.getAll();
      return { data: hojas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get hojas-despacho:');
      return errorDb(error, 'Error al obtener hojas de despacho');
    }
  },

  async getById(id: number) {
    try {
      const hoja = await HojaDespachoModel.getById(id);
      if (!hoja) {
        return { data: null, error: 'Hoja de despacho no encontrada', status: 404 };
      }
      const detalles = await HojaDespachoDetalleModel.getByHojaDespachoId(id);
      return { data: { ...hoja, detalles }, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get hoja-despacho:');
      return errorDb(error, 'Error al obtener hoja de despacho');
    }
  },

  async create(data: CrearHojaDespachoInput) {
    try {
      if (!data.pedido_id || !data.sucursal_despacho) {
        return { data: null, error: 'pedido_id y sucursal_despacho son requeridos', status: 400 };
      }
      const hoja = await crearHojaDespacho(data);
      return { data: hoja, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create hoja-despacho:');
      return errorDb(error, 'Error al crear hoja de despacho');
    }
  }
};
