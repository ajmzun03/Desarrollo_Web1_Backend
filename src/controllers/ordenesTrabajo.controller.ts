import { OrdenTrabajoModel } from '../model/supabase/ordenTrabajo.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { RecetaDetalleModel, RecetaModel } from '../model/supabase/receta.model.js';
import { terminarOrdenTrabajo } from '../services/produccion.service.js';
import { TRANSICIONES_ORDEN_TRABAJO, validarTransicion } from '../utils/transiciones.js';

export const OrdenesTrabajoController = {
  async getAll(sucursalId?: number, estado?: string) {
    try {
      let ordenes;
      if (estado) {
        ordenes = await OrdenTrabajoModel.getByEstado(estado);
      } else if (sucursalId) {
        ordenes = await OrdenTrabajoModel.getBySucursalId(sucursalId);
      } else {
        ordenes = await OrdenTrabajoModel.getAll();
      }
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get ordenes-trabajo:');
      return errorDb(error, 'Error al obtener órdenes de trabajo');
    }
  },

  async getCola(sucursalId?: number) {
    try {
      const ordenes = await OrdenTrabajoModel.getByEstado('GENERADA');
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get cola ordenes-trabajo:');
      return errorDb(error, 'Error al obtener cola de órdenes');
    }
  },

  async getById(id: number) {
    try {
      const orden = await OrdenTrabajoModel.getById(id);
      if (!orden) {
        return { data: null, error: 'Orden de trabajo no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get orden-trabajo:');
      return errorDb(error, 'Error al obtener orden de trabajo');
    }
  },

  async getReceta(id: number) {
    try {
      const orden = await OrdenTrabajoModel.getById(id);
      if (!orden || !orden.receta_id) {
        return { data: null, error: 'Orden de trabajo no encontrada', status: 404 };
      }
      const detalles = await RecetaDetalleModel.getByRecetaId(orden.receta_id);
      return { data: { orden, detalles }, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get receta orden:');
      return errorDb(error, 'Error al obtener receta de la orden');
    }
  },

  async create(data: { sucursal_id: number; receta_id: number; cantidad_produccion: number }) {
    try {
      if (!data.sucursal_id || !data.receta_id || !data.cantidad_produccion) {
        return { data: null, error: 'sucursal_id, receta_id y cantidad_produccion son requeridos', status: 400 };
      }
      const nuevaOrden = await OrdenTrabajoModel.create({
        sucursal_id: data.sucursal_id,
        receta_id: data.receta_id,
        cantidad_produccion: String(data.cantidad_produccion),
        estado: 'GENERADA'
      });
      return { data: nuevaOrden, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create orden-trabajo:');
      return errorDb(error, 'Error al crear orden de trabajo');
    }
  },

  async updateEstado(id: number, estado: 'GENERADA' | 'EN_PREPARACION' | 'ANULADA' | 'FINALIZADA') {
    try {
      // Finalizar descuenta materia prima y crea el lote: solo se hace con /terminar
      if (estado === 'FINALIZADA') {
        return { data: null, error: 'Para finalizar una orden usa PATCH /ordenes-trabajo/:id/terminar', status: 400 };
      }
      const actual = await OrdenTrabajoModel.getById(id);
      validarTransicion(TRANSICIONES_ORDEN_TRABAJO, actual?.estado, estado, 'la orden de trabajo');
      const orden = await OrdenTrabajoModel.update(id, { estado });
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update estado orden-trabajo:');
      return errorDb(error, 'Error al actualizar estado de orden de trabajo');
    }
  },

  async iniciar(id: number) {
    try {
      const actual = await OrdenTrabajoModel.getById(id);
      validarTransicion(TRANSICIONES_ORDEN_TRABAJO, actual?.estado, 'EN_PREPARACION', 'la orden de trabajo');
      const orden = await OrdenTrabajoModel.update(id, { estado: 'EN_PREPARACION' });
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error iniciar orden-trabajo:');
      return errorDb(error, 'Error al iniciar orden de trabajo');
    }
  },

  async terminar(id: number) {
    try {
      const resultado = await terminarOrdenTrabajo(id);
      return { data: resultado, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error terminar orden-trabajo:');
      return errorDb(error, 'Error al terminar orden de trabajo');
    }
  }
};
