import { ProductoExtraModel } from '../model/supabase/productoExtra.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const ProductosExtraController = {
  async getAll() {
    try {
      const extras = await ProductoExtraModel.getAll();
      return { data: extras, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get extras:');
      return errorDb(error, 'Error al obtener productos extra');
    }
  },

  async getById(id: number) {
    try {
      const extra = await ProductoExtraModel.getById(id);
      if (!extra) {
        return { data: null, error: 'Producto extra no encontrado', status: 404 };
      }
      return { data: extra, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get extra:');
      return errorDb(error, 'Error al obtener producto extra');
    }
  },

  async getByProducto(productoId: number) {
    try {
      const extras = await ProductoExtraModel.getByProductoId(productoId);
      return { data: extras, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get extras por producto:');
      return errorDb(error, 'Error al obtener extras del producto');
    }
  },

  async create(data: { producto_id: number; nombre: string; precio: number; activo?: boolean }) {
    try {
      const nuevoExtra = await ProductoExtraModel.create({
        producto_id: data.producto_id,
        nombre: data.nombre,
        precio: String(data.precio),
        activo: data.activo ?? true
      });
      return { data: nuevoExtra, error: null, status: 201 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error create extra:');
      return errorDb(error, 'Error al crear producto extra');
    }
  },

  async update(id: number, data: { producto_id?: number; nombre?: string; precio?: number; activo?: boolean }) {
    try {
      const updateData: any = {};
      if (data.producto_id !== undefined) updateData.producto_id = data.producto_id;
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.precio !== undefined) updateData.precio = String(data.precio);
      if (data.activo !== undefined) updateData.activo = data.activo;

      const actualizado = await ProductoExtraModel.update(id, updateData);
      if (!actualizado) {
        return { data: null, error: 'Producto extra no encontrado', status: 404 };
      }
      return { data: actualizado, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error update extra:');
      return errorDb(error, 'Error al actualizar producto extra');
    }
  },

  async delete(id: number) {
    try {
      const desactivado = await ProductoExtraModel.delete(id);
      if (!desactivado) {
        return { data: null, error: 'Producto extra no encontrado', status: 404 };
      }
      return { data: { message: 'Producto extra desactivado exitosamente' }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error delete extra:');
      return errorDb(error, 'Error al desactivar producto extra');
    }
  }
};
