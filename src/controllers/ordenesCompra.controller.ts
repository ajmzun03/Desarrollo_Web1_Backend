import { OrdenCompraModel, DetalleOrdenCompraModel } from '../model/supabase/ordenCompra.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { crearOrdenCompra } from '../services/ordenesCompra.service.js';
import { TRANSICIONES_ORDEN_COMPRA, validarTransicion } from '../utils/transiciones.js';

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
      logger.error({ err: error }, 'Error get ordenes-compra:');
      return errorDb(error, 'Error al obtener órdenes de compra');
    }
  },

  async getProgramadas(bodegaId?: number) {
    try {
      const ordenes = await OrdenCompraModel.getByEstado('EN_PREPARACION');
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get ordenes-compra programadas:');
      return errorDb(error, 'Error al obtener órdenes de compra programadas');
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
      logger.error({ err: error }, 'Error get orden-compra:');
      return errorDb(error, 'Error al obtener orden de compra');
    }
  },

  async create(data: { proveedor_id: number; sucursal_destino: number; items: Array<{ materia_prima_id: number; cantidad_solicitada: number; precio_unitario: number }> }) {
    try {
      if (!data.proveedor_id || !data.sucursal_destino || !data.items || !Array.isArray(data.items)) {
        return { data: null, error: 'proveedor_id, sucursal_destino y items son requeridos', status: 400 };
      }
      const nuevaOrden = await crearOrdenCompra(data);
      return { data: nuevaOrden, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create orden-compra:');
      return errorDb(error, 'Error al crear orden de compra');
    }
  },

  async agendar(id: number) {
    try {
      const actual = await OrdenCompraModel.getById(id);
      validarTransicion(TRANSICIONES_ORDEN_COMPRA, actual?.estado_orden, 'EN_PREPARACION', 'la orden de compra');
      const orden = await OrdenCompraModel.update(id, { estado_orden: 'EN_PREPARACION' });
      if (!orden) {
        return { data: null, error: 'Orden de compra no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error agendar orden-compra:');
      return errorDb(error, 'Error al agendar orden de compra');
    }
  },

  async updateEstado(id: number, estado: 'CREADA' | 'EN_PREPARACION' | 'FINALIZADO' | 'ANULADO') {
    try {
      // FINALIZADO se alcanza al recibir la mercadería (hoja de recepción TOTAL)
      if (estado === 'FINALIZADO') {
        return { data: null, error: 'Una orden se finaliza al registrar su recepción TOTAL', status: 400 };
      }
      const actual = await OrdenCompraModel.getById(id);
      validarTransicion(TRANSICIONES_ORDEN_COMPRA, actual?.estado_orden, estado, 'la orden de compra');
      const orden = await OrdenCompraModel.update(id, { estado_orden: estado });
      if (!orden) {
        return { data: null, error: 'Orden de compra no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update estado orden-compra:');
      return errorDb(error, 'Error al actualizar estado de orden de compra');
    }
  }
};