import { ClienteModel } from '../model/supabase/cliente.model.js';

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
      console.error('Error get clientes:', error);
      return { data: null, error: 'Error al obtener clientes', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const cliente = await ClienteModel.getById(id);
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }
      return { data: cliente, error: null, status: 200 };
    } catch (error) {
      console.error('Error get cliente:', error);
      return { data: null, error: 'Error al obtener cliente', status: 500 };
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
      console.error('Error create cliente:', error);
      return { data: null, error: 'Error al crear cliente', status: 500 };
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
      console.error('Error update cliente:', error);
      return { data: null, error: 'Error al actualizar cliente', status: 500 };
    }
  }
};