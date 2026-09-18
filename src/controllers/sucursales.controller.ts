import { SucursalModel } from '../model/supabase/sucursal.model.js';
import logger from '../config/logger.js';

export const SucursalesController = {
  async getAll() {
    try {
      const sucursales = await SucursalModel.getAll();
      return { data: sucursales, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get sucursales:');
      return { data: null, error: 'Error al obtener sucursales', status: 500 };
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
      logger.error({ error }, 'Error get sucursal:');
      return { data: null, error: 'Error al obtener sucursal', status: 500 };
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
      logger.error({ error }, 'Error create sucursal:');
      return { data: null, error: 'Error al crear sucursal', status: 500 };
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
      logger.error({ error }, 'Error update sucursal:');
      return { data: null, error: 'Error al actualizar sucursal', status: 500 };
    }
  }
};