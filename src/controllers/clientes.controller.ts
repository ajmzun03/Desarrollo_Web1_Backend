import { ClienteModel } from '../model/supabase/cliente.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { exigirAsignado } from '../services/asignaciones.service.js';
import type { DecodedToken } from '../jwt.js';

export const ClientesController = {
  async getAll(telefono?: string) {
    try {
      if (telefono) {
        const cliente = await ClienteModel.getByTelefono(telefono);
        return { data: cliente ? [cliente] : [], error: null, status: 200 };
      }
      const clientes = await ClienteModel.getAll();
      return { data: clientes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get clientes:');
      return errorDb(error, 'Error al obtener clientes');
    }
  },

  async getById(id: number, user?: DecodedToken) {
    try {
      // Un repartidor solo consulta a los clientes de los pedidos que tiene asignados
      if (user) await exigirAsignado(user, 'cliente', id);
      const cliente = await ClienteModel.getById(id);
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }
      return { data: cliente, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get cliente:');
      return errorDb(error, 'Error al obtener cliente');
    }
  },

  async create(data: { nombre: string; apellido: string; telefono: string; telefono_ref: string }) {
    try {
      if (!data.nombre || !data.apellido || !data.telefono || !data.telefono_ref) {
        return { data: null, error: 'nombre, apellido, telefono y telefono_ref son requeridos', status: 400 };
      }
      const existingClient = await ClienteModel.getByTelefono(data.telefono);
      if (existingClient) {
        return { data: null, error: 'El teléfono ya está registrado', status: 400 };
      }
      const nuevoCliente = await ClienteModel.create(data);
      return { data: nuevoCliente, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create cliente:');
      return errorDb(error, 'Error al crear cliente');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const cliente = await ClienteModel.update(id, data);
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }
      return { data: cliente, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update cliente:');
      return errorDb(error, 'Error al actualizar cliente');
    }
  }
};