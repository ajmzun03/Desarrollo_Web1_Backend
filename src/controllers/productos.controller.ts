import { ProductoModel } from '../model/supabase/producto.model.js';
import logger from '../config/logger.js';

export const ProductosController = {
  async getAll() {
    try {
      const productos = await ProductoModel.getAll();
      return { data: productos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get productos:');
      return { data: null, error: 'Error al obtener productos', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const producto = await ProductoModel.getById(id);
      if (!producto) {
        return { data: null, error: 'Producto no encontrado', status: 404 };
      }
      return { data: producto, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get producto:');
      return { data: null, error: 'Error al obtener producto', status: 500 };
    }
  },

  async getDisponibilidad(sucursalId?: number) {
    try {
      const productos = await ProductoModel.getAll();
      return { data: productos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get disponibilidad:');
      return { data: null, error: 'Error al obtener disponibilidad', status: 500 };
    }
  },

  async create(data: { categoria_id: number; unidad_medida_id: number; producto: string; precio: number }) {
    try {
      if (!data.categoria_id || !data.unidad_medida_id || !data.producto || !data.precio) {
        return { data: null, error: 'categoria_id, unidad_medida_id, producto y precio son requeridos', status: 400 };
      }
      const nuevoProducto = await ProductoModel.create(data);
      return { data: nuevoProducto, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create producto:');
      return { data: null, error: 'Error al crear producto', status: 500 };
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const producto = await ProductoModel.update(id, data);
      if (!producto) {
        return { data: null, error: 'Producto no encontrado', status: 404 };
      }
      return { data: producto, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error update producto:');
      return { data: null, error: 'Error al actualizar producto', status: 500 };
    }
  },

  async updateStockMinimo(id: number, stockMinimo: number) {
    try {
      const producto = await ProductoModel.update(id, {});
      if (!producto) {
        return { data: null, error: 'Producto no encontrado', status: 404 };
      }
      return { data: { ...producto, stock_minimo: stockMinimo }, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error update stock-minimo:');
      return { data: null, error: 'Error al actualizar stock mínimo', status: 500 };
    }
  }
};