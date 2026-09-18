import { CategoriaModel } from '../model/supabase/categoria.model.js';
import logger from '../config/logger.js';

export const CategoriasController = {
  async getAll() {
    try {
      const categorias = await CategoriaModel.getAll();
      return { data: categorias, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get categorias:');
      return { data: null, error: 'Error al obtener categorías', status: 500 };
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
      logger.error({ error }, 'Error get categoria:');
      return { data: null, error: 'Error al obtener categoría', status: 500 };
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
      logger.error({ error }, 'Error create categoria:');
      return { data: null, error: 'Error al crear categoría', status: 500 };
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
      logger.error({ error }, 'Error update categoria:');
      return { data: null, error: 'Error al actualizar categoría', status: 500 };
    }
  }
};