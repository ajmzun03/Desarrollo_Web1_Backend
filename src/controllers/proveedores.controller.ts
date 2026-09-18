import { ProveedorModel } from '../model/supabase/proveedor.model.js';
import logger from '../config/logger.js';

export const ProveedoresController = {
  async getAll() {
    try {
      const proveedores = await ProveedorModel.getAll();
      return { data: proveedores, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get proveedores:');
      return { data: null, error: 'Error al obtener proveedores', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const proveedor = await ProveedorModel.getById(id);
      if (!proveedor) {
        return { data: null, error: 'Proveedor no encontrado', status: 404 };
      }
      return { data: proveedor, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get proveedor:');
      return { data: null, error: 'Error al obtener proveedor', status: 500 };
    }
  },

  async create(data: { no_nit: string; proveedor: string; direccion?: string }) {
    try {
      if (!data.no_nit || !data.proveedor) {
        return { data: null, error: 'no_nit y proveedor son requeridos', status: 400 };
      }
      const nuevoProveedor = await ProveedorModel.create(data);
      return { data: nuevoProveedor, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create proveedor:');
      return { data: null, error: 'Error al crear proveedor', status: 500 };
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const proveedor = await ProveedorModel.update({ id, ...data });
      if (!proveedor) {
        return { data: null, error: 'Proveedor no encontrado', status: 404 };
      }
      return { data: proveedor, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error update proveedor:');
      return { data: null, error: 'Error al actualizar proveedor', status: 500 };
    }
  }
};