import { UnidadMedidaModel } from '../model/supabase/unidadMedida.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const UnidadesMedidaController = {
  async getAll() {
    try {
      const unidades = await UnidadMedidaModel.getAll();
      return { data: unidades, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get unidades-medida:');
      return errorDb(error, 'Error al obtener unidades de medida');
    }
  },

  async getById(id: number) {
    try {
      const unidad = await UnidadMedidaModel.getById(id);
      if (!unidad) {
        return { data: null, error: 'Unidad de medida no encontrada', status: 404 };
      }
      return { data: unidad, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get unidad-medida:');
      return errorDb(error, 'Error al obtener unidad de medida');
    }
  },

  async create(data: { unidad: string; abreviatura: string }) {
    try {
      if (!data.unidad || !data.abreviatura) {
        return { data: null, error: 'unidad y abreviatura son requeridos', status: 400 };
      }
      const nuevaUnidad = await UnidadMedidaModel.create(data);
      return { data: nuevaUnidad, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create unidad-medida:');
      return errorDb(error, 'Error al crear unidad de medida');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const unidad = await UnidadMedidaModel.update(id, data);
      if (!unidad) {
        return { data: null, error: 'Unidad de medida no encontrada', status: 404 };
      }
      return { data: unidad, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update unidad-medida:');
      return errorDb(error, 'Error al actualizar unidad de medida');
    }
  }
};