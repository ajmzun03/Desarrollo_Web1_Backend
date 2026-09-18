import { DireccionModel } from '../model/supabase/direccion.model.js';
import logger from '../config/logger.js';

export const DireccionesController = {
  async getAll(clienteId?: number) {
    try {
      const direcciones = await DireccionModel.getAll();
      const filtradas = clienteId ? direcciones.filter(d => d.cliente_id === clienteId) : direcciones;
      return { data: filtradas, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'No se encontraron direcciones') {
        return { data: [], error: null, status: 200 };
      }
      logger.error({ error }, 'Error get direcciones:');
      return { data: null, error: 'Error al obtener direcciones', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const direccion = await DireccionModel.getById(id);
      return { data: direccion, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Direccion no encontrada') {
        return { data: null, error: 'Dirección no encontrada', status: 404 };
      }
      logger.error({ error }, 'Error get direccion:');
      return { data: null, error: 'Error al obtener dirección', status: 500 };
    }
  },

  async create(data: { cliente_id: number; municipio_id: number; direccion1: string; direccion2: string }) {
    try {
      if (!data.cliente_id || !data.municipio_id || !data.direccion1 || !data.direccion2) {
        return { data: null, error: 'cliente_id, municipio_id, direccion1 y direccion2 son requeridos', status: 400 };
      }
      const nuevaDireccion = await DireccionModel.create(data);
      return { data: nuevaDireccion, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create direccion:');
      return { data: null, error: 'Error al crear dirección', status: 500 };
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const direccion = await DireccionModel.update(id, data);
      return { data: direccion, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Error al actualizar la direccion') {
        return { data: null, error: 'Dirección no encontrada', status: 404 };
      }
      logger.error({ error }, 'Error update direccion:');
      return { data: null, error: 'Error al actualizar dirección', status: 500 };
    }
  }
};