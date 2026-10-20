import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { crearReceta } from '../services/recetas.service.js';

export const RecetasController = {
  async getAll() {
    try {
      const recetas = await RecetaModel.getAll();
      return { data: recetas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get recetas:');
      return errorDb(error, 'Error al obtener recetas');
    }
  },

  async getById(id: number) {
    try {
      const receta = await RecetaModel.getById(id);
      if (!receta) {
        return { data: null, error: 'Receta no encontrada', status: 404 };
      }
      const detalles = await RecetaDetalleModel.getByRecetaId(id);
      return { data: { ...receta, detalles }, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get receta:');
      return errorDb(error, 'Error al obtener receta');
    }
  },

  async create(data: { producto_id: number; nombre: string; cantidad_lote: number; items?: Array<{ materia_prima_id: number; cantidad_necesaria: number }> }) {
    try {
      if (!data.producto_id || !data.nombre || !data.cantidad_lote) {
        return { data: null, error: 'producto_id, nombre y cantidad_lote son requeridos', status: 400 };
      }
      const nuevaReceta = await crearReceta(data);
      return { data: nuevaReceta, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create receta:');
      return errorDb(error, 'Error al crear receta');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const receta = await RecetaModel.update(id, data);
      if (!receta) {
        return { data: null, error: 'Receta no encontrada', status: 404 };
      }
      return { data: receta, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update receta:');
      return errorDb(error, 'Error al actualizar receta');
    }
  }
};