import { ComboModel } from '../model/supabase/combo.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { db } from '../model/supabase/db.model.js';

export const CombosController = {
  async getAll() {
    try {
      const combos = await ComboModel.getAll();
      return { data: combos, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get combos:');
      return errorDb(error, 'Error al obtener combos');
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
      logger.error({ err: error }, 'Error get combo:');
      return errorDb(error, 'Error al obtener combo');
    }
  },

  async create(data: { nombre: string; precio: number; imagen?: string; items: Array<{ producto_id: number; cantidad: number }> }) {
    try {
      // Cabecera y detalles en una transacción: si un producto no existe no queda un combo vacío
      const creado = await db.transaction(async (tx) => {
        const nuevoCombo = await ComboModel.create({
          nombre: data.nombre,
          precio: String(data.precio),
          imagen: data.imagen ?? null,
          activo: true
        }, tx);
        const detalles = [];
        for (const item of data.items) {
          detalles.push(await ComboModel.createDetalle({
            combo_id: Number(nuevoCombo.id),
            producto_id: item.producto_id,
            cantidad: String(item.cantidad)
          }, tx));
        }
        return { ...nuevoCombo, detalles };
      });

      return { data: creado, error: null, status: 201 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error create combo:');
      return errorDb(error, 'Error al crear combo');
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

      // Reemplazar los detalles debe ser atómico: si falla a medias no se pierde la composición del combo
      const actualizado = await db.transaction(async (tx) => {
        const resultado = await ComboModel.update(id, updateData, tx);
        if (data.items) {
          await ComboModel.deleteDetalles(id, tx);
          for (const item of data.items) {
            await ComboModel.createDetalle({
              combo_id: id,
              producto_id: item.producto_id,
              cantidad: String(item.cantidad)
            }, tx);
          }
        }
        return resultado;
      });

      const detalles = await ComboModel.getDetalles(id);
      return { data: { ...actualizado, detalles }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error update combo:');
      return errorDb(error, 'Error al actualizar combo');
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
      logger.error({ err: error }, 'Error delete combo:');
      return errorDb(error, 'Error al eliminar combo');
    }
  }
};
