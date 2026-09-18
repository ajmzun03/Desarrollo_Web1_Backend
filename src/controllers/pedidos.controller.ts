import { PedidoModel } from '../model/supabase/pedido.model.js';
import logger from '../config/logger.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
import { ProductoModel } from '../model/supabase/producto.model.js';

export const PedidosController = {
  async getAll() {
    try {
      const pedidos = await PedidoModel.getAll();
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get pedidos:');
      return { data: null, error: 'Error al obtener pedidos', status: 500 };
    }
  },

  async getListos() {
    try {
      const pedidos = await PedidoModel.getByEstado('LISTO');
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get pedidos listos:');
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
      logger.error({ error }, 'Error get pedido:');
      return { data: null, error: 'Error al obtener pedido', status: 500 };
    }
  },

  async create(data: { cliente_id: number; observaciones?: string; items: Array<{ producto_id: number; cantidad: number }> }) {
    try {
      if (!data.cliente_id || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'cliente_id y items son requeridos', status: 400 };
      }

      const itemsConPrecio: Array<{ producto_id: number; cantidad: number; precio_unitario: number }> = [];
      let total = 0;

      for (const item of data.items) {
        try {
          const producto = await ProductoModel.getById(item.producto_id);
          const precio = producto?.precio ?? 0;
          itemsConPrecio.push({ ...item, precio_unitario: precio });
          total += precio * item.cantidad;
        } catch {
          itemsConPrecio.push({ ...item, precio_unitario: 0 });
        }
      }

      const nuevoPedido = await PedidoModel.createPedido({
        cliente_id: data.cliente_id,
        observaciones: data.observaciones,
        total,
        estado: 'CREADO'
      });

      for (const item of itemsConPrecio) {
        await DetallePedidoModel.create({
          pedido_id: Number(nuevoPedido.id),
          producto_id: item.producto_id,
          precio_unitario: item.precio_unitario,
          cantidad: item.cantidad
        });
      }

      const detalles = await DetallePedidoModel.getByPedidoId(Number(nuevoPedido.id));
      return { data: { ...nuevoPedido, detalles }, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create pedido:');
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
      logger.error({ error }, 'Error confirmar pedido:');
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
      logger.error({ error }, 'Error update estado pedido:');
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
      logger.error({ error }, 'Error entregado pedido:');
      return { data: null, error: 'Error al marcar pedido como entregado', status: 500 };
    }
  }
};