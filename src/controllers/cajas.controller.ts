import { CajaModel } from '../model/supabase/caja.model.js';

export const CajasController = {
  async getAll(sucursalId?: number) {
    try {
      const cajas = sucursalId
        ? await CajaModel.getBySucursalId(sucursalId)
        : await CajaModel.getAll();
      return { data: cajas, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'No se encontraron cajas') {
        return { data: [], error: null, status: 200 };
      }
      console.error('Error get cajas:', error);
      return { data: null, error: 'Error al obtener cajas', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const caja = await CajaModel.getById(id);
      return { data: caja, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Caja no encontrada') {
        return { data: null, error: 'Caja no encontrada', status: 404 };
      }
      console.error('Error get caja:', error);
      return { data: null, error: 'Error al obtener caja', status: 500 };
    }
  },

  async create(data: { sucursal_id: number; nombre: string; tipo?: 'CAJA_CHICA' | 'GASTOS_REPRESENTACION' | 'TRANSITO' }) {
    try {
      if (!data.sucursal_id || !data.nombre) {
        return { data: null, error: 'sucursal_id y nombre son requeridos', status: 400 };
      }
      const nuevaCaja = await CajaModel.create(data);
      return { data: nuevaCaja, error: null, status: 201 };
    } catch (error) {
      console.error('Error create caja:', error);
      return { data: null, error: 'Error al crear caja', status: 500 };
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const caja = await CajaModel.update(id, data);
      return { data: caja, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Error al actualizar la caja') {
        return { data: null, error: 'Caja no encontrada', status: 404 };
      }
      console.error('Error update caja:', error);
      return { data: null, error: 'Error al actualizar caja', status: 500 };
    }
  }
};