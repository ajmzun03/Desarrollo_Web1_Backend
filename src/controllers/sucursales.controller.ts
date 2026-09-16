import { SucursalModel } from '../model/supabase/sucursal.model.js';

export const SucursalesController = {
  async getAll() {
    try {
      const sucursales = await SucursalModel.getAll();
      return { data: sucursales, error: null, status: 200 };
    } catch (error) {
      console.error('Error get sucursales:', error);
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
      console.error('Error get sucursal:', error);
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
      console.error('Error create sucursal:', error);
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
      console.error('Error update sucursal:', error);
      return { data: null, error: 'Error al actualizar sucursal', status: 500 };
    }
  }
};