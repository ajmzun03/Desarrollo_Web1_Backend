import { PedidoModel } from '../model/supabase/pedido.model.js';
import logger from '../config/logger.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
import { ProductoModel } from '../model/supabase/producto.model.js';
import { HojaDespachoModel } from '../model/supabase/hojaDespacho.model.js';

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
  },

  async incidente(id: number, motivo: string, detalle?: string) {
    try {
      const pedido = await PedidoModel.getPedidoId(id);
      if (!pedido) {
        return { data: null, error: 'Pedido no encontrado', status: 404 };
      }
      const texto = `[INCIDENTE] ${motivo}${detalle ? ` — ${detalle}` : ''}`;
      const observaciones = pedido.observaciones ? `${pedido.observaciones} | ${texto}` : texto;
      const actualizado = await PedidoModel.updatePedido(id, { observaciones });
      return { data: actualizado, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error incidente pedido:');
      return { data: null, error: 'Error al registrar el incidente', status: 500 };
    }
  },

  async getPedidosRepartidor(repartidorId?: number) {
    try {
      if (!repartidorId) {
        return { data: null, error: 'repartidor_id es requerido', status: 400 };
      }
      const hojas = await HojaDespachoModel.getByRepartidorId(repartidorId);
      const pedidos: Array<Record<string, any>> = [];
      for (const hoja of hojas) {
        if (hoja.pedido_id) {
          const pedido = await PedidoModel.getPedidoId(Number(hoja.pedido_id));
          if (pedido) {
            pedidos.push({ ...pedido, hoja_despacho_id: Number(hoja.id) });
          }
        }
      }
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get pedidos repartidor:');
      return { data: null, error: 'Error al obtener pedidos del repartidor', status: 500 };
    }
  }
};