import { CategoriaModel } from '../model/supabase/categoria.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const CategoriasController = {
  async getAll() {
    try {
      const categorias = await CategoriaModel.getAll();
      return { data: categorias, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get categorias:');
      return errorDb(error, 'Error al obtener categorías');
    }
  },

  async getById(id: number) {
    try {
      const categoria = await CategoriaModel.getById(id);
      if (!categoria) {
        return { data: null, error: 'Categoría no encontrada', status: 404 };
      }
      return { data: categoria, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get categoria:');
      return errorDb(error, 'Error al obtener categoría');
    }
  },

  async create(data: { categoria_id: number; descripcion: string }) {
    try {
      if (!data.categoria_id || !data.descripcion) {
        return { data: null, error: 'categoria_id y descripcion son requeridos', status: 400 };
      }
      const nuevaCategoria = await CategoriaModel.create(data);
      return { data: nuevaCategoria, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create categoria:');
      return errorDb(error, 'Error al crear categoría');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const categoria = await CategoriaModel.update(id, data);
      if (!categoria) {
        return { data: null, error: 'Categoría no encontrada', status: 404 };
      }
      return { data: categoria, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update categoria:');
      return errorDb(error, 'Error al actualizar categoría');
    }
  }
};