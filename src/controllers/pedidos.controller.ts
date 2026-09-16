import { PedidoModel } from '../model/supabase/pedido.model.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';

export const PedidosController = {
  async getAll() {
    try {
      const pedidos = await PedidoModel.getAll();
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      console.error('Error get pedidos:', error);
      return { data: null, error: 'Error al obtener pedidos', status: 500 };
    }
  },

  async getListos() {
    try {
      const pedidos = await PedidoModel.getByEstado('LISTO');
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      console.error('Error get pedidos listos:', error);
      return { data: null, error: 'Error al obtener pedidos listos', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const pedido = await PedidoModel.getPedidoId(id);
      if (!pedido) {
        return { data: null, error: 'Pedido no encontrado', status: 404 };
      }
      const detalles = await DetallePedidoModel.getByPedidoId(id);
      return { data: { ...pedido, detalles }, error: null, status: 200 };
    } catch (error) {
      console.error('Error get pedido:', error);
      return { data: null, error: 'Error al obtener pedido', status: 500 };
    }
  },

  async create(data: { cliente_id: number; observaciones?: string; items: Array<{ producto_id: number; cantidad: number }> }) {
    try {
      if (!data.cliente_id || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'cliente_id y items son requeridos', status: 400 };
      }
      const nuevoPedido = await PedidoModel.createPedido({
        cliente_id: data.cliente_id,
        observaciones: data.observaciones,
        estado: 'CREADO'
      });
      for (const item of data.items) {
        await DetallePedidoModel.create({
          pedido_id: Number(nuevoPedido.id),
          producto_id: item.producto_id,
          cantidad: item.cantidad
        });
      }
      const detalles = await DetallePedidoModel.getByPedidoId(Number(nuevoPedido.id));
      return { data: { ...nuevoPedido, detalles }, error: null, status: 201 };
    } catch (error) {
      console.error('Error create pedido:', error);
      return { data: null, error: 'Error al crear pedido', status: 500 };
    }
  },

  async confirmar(id: number) {
    try {
      const pedido = await PedidoModel.updatePedido(id, { estado: 'LISTO' });
      if (!pedido) {
        return { data: null, error: 'Pedido no encontrado', status: 404 };
      }
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      console.error('Error confirmar pedido:', error);
      return { data: null, error: 'Error al confirmar pedido', status: 500 };
    }
  },

  async updateEstado(id: number, estado: 'ANULADO' | 'CREADO' | 'ENTREGADO' | 'EN_RUTA' | 'LISTO') {
    try {
      const pedido = await PedidoModel.updatePedido(id, { estado });
      if (!pedido) {
        return { data: null, error: 'Pedido no encontrado', status: 404 };
      }
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      console.error('Error update estado pedido:', error);
      return { data: null, error: 'Error al actualizar estado de pedido', status: 500 };
    }
  },

  async marcarEntregado(id: number) {
    try {
      const pedido = await PedidoModel.updatePedido(id, { estado: 'ENTREGADO' });
      if (!pedido) {
        return { data: null, error: 'Pedido no encontrado', status: 404 };
      }
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      console.error('Error entregado pedido:', error);
      return { data: null, error: 'Error al marcar pedido como entregado', status: 500 };
    }
  }
};