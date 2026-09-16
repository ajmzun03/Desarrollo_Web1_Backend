import { OrdenCompraModel, DetalleOrdenCompraModel } from '../model/supabase/ordenCompra.model.js';

export const OrdenesCompraController = {
  async getAll(estado?: string, sucursalId?: number) {
    try {
      let ordenes;
      if (estado) {
        ordenes = await OrdenCompraModel.getByEstado(estado);
      } else if (sucursalId) {
        ordenes = await OrdenCompraModel.getBySucursalId(sucursalId);
      } else {
        ordenes = await OrdenCompraModel.getAll();
      }
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      console.error('Error get ordenes-compra:', error);
      return { data: null, error: 'Error al obtener órdenes de compra', status: 500 };
    }
  },

  async getProgramadas(bodegaId?: number) {
    try {
      const ordenes = await OrdenCompraModel.getByEstado('EN_PROCESO');
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      console.error('Error get ordenes-compra programadas:', error);
      return { data: null, error: 'Error al obtener órdenes de compra programadas', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const orden = await OrdenCompraModel.getById(id);
      if (!orden) {
        return { data: null, error: 'Orden de compra no encontrada', status: 404 };
      }
      const detalles = await DetalleOrdenCompraModel.getByOrdenCompraId(id);
      return { data: { ...orden, detalles }, error: null, status: 200 };
    } catch (error) {
      console.error('Error get orden-compra:', error);
      return { data: null, error: 'Error al obtener orden de compra', status: 500 };
    }
  },

  async create(data: { proveedor_id: number; sucursal_destino: number; items: Array<{ materia_prima_id: number; cantidad_solicitada: number; precio_unitario: number }> }) {
    try {
      if (!data.proveedor_id || !data.sucursal_destino || !data.items || !Array.isArray(data.items)) {
        return { data: null, error: 'proveedor_id, sucursal_destino y items son requeridos', status: 400 };
      }
      const nuevaOrden = await OrdenCompraModel.create({
        proveedor_id: data.proveedor_id,
        sucursal_destino: data.sucursal_destino,
        estado_orden: 'CREADA'
      });
      for (const item of data.items) {
        const subtotal = item.cantidad_solicitada * item.precio_unitario;
        await DetalleOrdenCompraModel.create({
          orden_compra_id: Number(nuevaOrden.id),
          materia_prima_id: item.materia_prima_id,
          cantidad_solicitada: item.cantidad_solicitada,
          precio_unitario: item.precio_unitario,
          subtotal
        });
      }
      const detalles = await DetalleOrdenCompraModel.getByOrdenCompraId(Number(nuevaOrden.id));
      return { data: { ...nuevaOrden, detalles }, error: null, status: 201 };
    } catch (error) {
      console.error('Error create orden-compra:', error);
      return { data: null, error: 'Error al crear orden de compra', status: 500 };
    }
  },

  async agendar(id: number) {
    try {
      const orden = await OrdenCompraModel.update(id, { estado_orden: 'EN_PROCESO' });
      if (!orden) {
        return { data: null, error: 'Orden de compra no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      console.error('Error agendar orden-compra:', error);
      return { data: null, error: 'Error al agendar orden de compra', status: 500 };
    }
  },

  async updateEstado(id: number, estado: string) {
    try {
      const orden = await OrdenCompraModel.update(id, { estado_orden: estado });
      if (!orden) {
        return { data: null, error: 'Orden de compra no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      console.error('Error update estado orden-compra:', error);
      return { data: null, error: 'Error al actualizar estado de orden de compra', status: 500 };
    }
  }
};