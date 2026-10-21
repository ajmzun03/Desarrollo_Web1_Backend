import { ProductoModel } from '../model/supabase/producto.model.js';
import { errorDb } from '../utils/errors.js';
import { ProductoLoteModel } from '../model/supabase/productoLote.model.js';
import logger from '../config/logger.js';

export const ProductosController = {
  async getAll() {
    try {
      const productos = await ProductoModel.getAll();
      return { data: productos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get productos:');
      return errorDb(error, 'Error al obtener productos');
    }
  },

  async getStock(sucursalId?: number) {
    try {
      if (!sucursalId) {
        return { data: null, error: 'sucursal_id es requerido', status: 400 };
      }
      const lotes = await ProductoLoteModel.getBySucursalId(sucursalId);
      return { data: lotes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get productos stock:');
      return errorDb(error, 'Error al obtener stock de productos');
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
      logger.error({ err: error }, 'Error get producto:');
      return errorDb(error, 'Error al obtener producto');
    }
  },

  async getDisponibilidad(sucursalId?: number) {
    try {
      const productos = (await ProductoModel.getAll()).filter(p => p.activo);
      const stock = new Map((await ProductoLoteModel.getDisponibilidad(sucursalId)).map(s => [s.producto_id, s.disponible]));
      const data = productos.map(p => {
        const disponible = stock.get(Number(p.id)) ?? 0;
        return { ...p, disponible, agotado: disponible <= 0, bajo_minimo: disponible <= Number(p.stock_minimo ?? 0) };
      });
      return { data, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get disponibilidad:');
      return errorDb(error, 'Error al obtener disponibilidad');
    }
  },

  async create(data: { categoria_id: number; unidad_medida_id: number; producto: string; precio: number; imagen_url?: string | null | undefined }) {
    try {
      if (!data.categoria_id || !data.unidad_medida_id || !data.producto || !data.precio) {
        return { data: null, error: 'categoria_id, unidad_medida_id, producto y precio son requeridos', status: 400 };
      }
      const nuevoProducto = await ProductoModel.create({ ...data, precio: String(data.precio) });
      return { data: nuevoProducto, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create producto:');
      return errorDb(error, 'Error al crear producto');
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
      logger.error({ err: error }, 'Error update producto:');
      return errorDb(error, 'Error al actualizar producto');
    }
  },

  async updateStockMinimo(id: number, stockMinimo: number) {
    try {
      const producto = await ProductoModel.update(id, { stock_minimo: String(stockMinimo) });
      if (!producto) {
        return { data: null, error: 'Producto no encontrado', status: 404 };
      }
      return { data: producto, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update stock-minimo:');
      return errorDb(error, 'Error al actualizar stock mínimo');
    }
  }
};