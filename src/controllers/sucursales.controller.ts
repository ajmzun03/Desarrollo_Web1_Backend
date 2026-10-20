import { SucursalModel } from '../model/supabase/sucursal.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const SucursalesController = {
  async getAll() {
    try {
      const sucursales = await SucursalModel.getAll();
      return { data: sucursales, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get sucursales:');
      return errorDb(error, 'Error al obtener sucursales');
    }
  },

  async getById(id: number) {
    try {
      const sucursal = await SucursalModel.getById(id);
      if (!sucursal) {
        return { data: null, error: 'Sucursal no encontrada', status: 404 };
      }
      return { data: sucursal, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get sucursal:');
      return errorDb(error, 'Error al obtener sucursal');
    }
  },

  async create(data: { municipio_id: number; sucursal: string; direccion?: string }) {
    try {
      if (!data.municipio_id || !data.sucursal) {
        return { data: null, error: 'municipio_id y sucursal son requeridos', status: 400 };
      }
      const nuevaSucursal = await SucursalModel.create(data);
      return { data: nuevaSucursal, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create sucursal:');
      return errorDb(error, 'Error al crear sucursal');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const sucursal = await SucursalModel.update(id, data);
      if (!sucursal) {
        return { data: null, error: 'Sucursal no encontrada', status: 404 };
      }
      return { data: sucursal, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update sucursal:');
      return errorDb(error, 'Error al actualizar sucursal');
    }
  }
};