import { ComboModel } from '../model/supabase/combo.model.js';
import logger from '../config/logger.js';

export const CombosController = {
  async getAll() {
    try {
      const combos = await ComboModel.getAll();
      return { data: combos, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get combos:');
      return { data: null, error: 'Error al obtener combos', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const combo = await ComboModel.getById(id);
      if (!combo) {
        return { data: null, error: 'Combo no encontrado', status: 404 };
      }
      const detalles = await ComboModel.getDetalles(id);
      return { data: { ...combo, detalles }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get combo:');
      return { data: null, error: 'Error al obtener combo', status: 500 };
    }
  },

  async create(data: { nombre: string; precio: number; imagen?: string; items: Array<{ producto_id: number; cantidad: number }> }) {
    try {
      const nuevoCombo = await ComboModel.create({
        nombre: data.nombre,
        precio: String(data.precio),
        imagen: data.imagen ?? null,
        activo: true
      });

      const comboId = Number(nuevoCombo.id);
      const detallesCreados = [];

      for (const item of data.items) {
        const detalle = await ComboModel.createDetalle({
          combo_id: comboId,
          producto_id: item.producto_id,
          cantidad: String(item.cantidad)
        });
        detallesCreados.push(detalle);
      }

      return {
        data: { ...nuevoCombo, detalles: detallesCreados },
        error: null,
        status: 201
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error create combo:');
      return { data: null, error: 'Error al crear combo', status: 500 };
    }
  },

  async update(id: number, data: { nombre?: string; precio?: number; imagen?: string; activo?: boolean; items?: Array<{ producto_id: number; cantidad: number }> }) {
    try {
      const combo = await ComboModel.getById(id);
      if (!combo) {
        return { data: null, error: 'Combo no encontrado', status: 404 };
      }

      const updateData: any = {};
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.precio !== undefined) updateData.precio = String(data.precio);
      if (data.imagen !== undefined) updateData.imagen = data.imagen;
      if (data.activo !== undefined) updateData.activo = data.activo;

      const actualizado = await ComboModel.update(id, updateData);

      if (data.items) {
        await ComboModel.deleteDetalles(id);
        for (const item of data.items) {
          await ComboModel.createDetalle({
            combo_id: id,
            producto_id: item.producto_id,
            cantidad: String(item.cantidad)
          });
        }
      }

      const detalles = await ComboModel.getDetalles(id);
      return { data: { ...actualizado, detalles }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error update combo:');
      return { data: null, error: 'Error al actualizar combo', status: 500 };
    }
  },

  async delete(id: number) {
    try {
      const eliminado = await ComboModel.delete(id);
      if (!eliminado) {
        return { data: null, error: 'Combo no encontrado', status: 404 };
      }
      return { data: { message: 'Combo desactivado exitosamente' }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error delete combo:');
      return { data: null, error: 'Error al eliminar combo', status: 500 };
    }
  }
};
