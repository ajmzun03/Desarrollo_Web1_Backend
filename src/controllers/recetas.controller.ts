import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';
import logger from '../config/logger.js';

export const RecetasController = {
  async getAll() {
    try {
      const recetas = await RecetaModel.getAll();
      return { data: recetas, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get recetas:');
      return { data: null, error: 'Error al obtener recetas', status: 500 };
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
      logger.error({ error }, 'Error get receta:');
      return { data: null, error: 'Error al obtener receta', status: 500 };
    }
  },

  async create(data: { producto_id: number; nombre: string; cantidad_lote: number; items?: Array<{ materia_prima_id: number; cantidad_necesaria: number }> }) {
    try {
      if (!data.producto_id || !data.nombre || !data.cantidad_lote) {
        return { data: null, error: 'producto_id, nombre y cantidad_lote son requeridos', status: 400 };
      }
      const nuevaReceta = await RecetaModel.create({
        producto_id: data.producto_id,
        nombre: data.nombre,
        cantidad_lote: data.cantidad_lote
      });
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await RecetaDetalleModel.create({
            receta_id: Number(nuevaReceta.id),
            materia_prima_id: item.materia_prima_id,
            cantidad_necesaria: item.cantidad_necesaria
          });
        }
      }
      const detalles = await RecetaDetalleModel.getByRecetaId(Number(nuevaReceta.id));
      return { data: { ...nuevaReceta, detalles }, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create receta:');
      return { data: null, error: 'Error al crear receta', status: 500 };
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
      logger.error({ error }, 'Error update receta:');
      return { data: null, error: 'Error al actualizar receta', status: 500 };
    }
  }
};