import { OrdenTrabajoModel } from '../model/supabase/ordenTrabajo.model.js';
import logger from '../config/logger.js';
import { RecetaDetalleModel } from '../model/supabase/receta.model.js';
import { ProductoLoteModel } from '../model/supabase/productoLote.model.js';

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
      logger.error({ error }, 'Error get ordenes-trabajo:');
      return { data: null, error: 'Error al obtener órdenes de trabajo', status: 500 };
    }
  },

  async getCola(sucursalId?: number) {
    try {
      const ordenes = await OrdenTrabajoModel.getByEstado('GENERADA');
      return { data: ordenes, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get cola ordenes-trabajo:');
      return { data: null, error: 'Error al obtener cola de órdenes', status: 500 };
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
      logger.error({ error }, 'Error get orden-trabajo:');
      return { data: null, error: 'Error al obtener orden de trabajo', status: 500 };
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
      logger.error({ error }, 'Error get receta orden:');
      return { data: null, error: 'Error al obtener receta de la orden', status: 500 };
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
        cantidad_produccion: data.cantidad_produccion,
        estado: 'GENERADA'
      });
      return { data: nuevaOrden, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create orden-trabajo:');
      return { data: null, error: 'Error al crear orden de trabajo', status: 500 };
    }
  },

  async updateEstado(id: number, estado: 'GENERADA' | 'EN_PROCESO' | 'ANULADA' | 'FINALIZADA') {
    try {
      const orden = await OrdenTrabajoModel.update(id, { estado });
      if (!orden) {
        return { data: null, error: 'Orden de trabajo no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error update estado orden-trabajo:');
      return { data: null, error: 'Error al actualizar estado de orden de trabajo', status: 500 };
    }
  },

  async iniciar(id: number) {
    try {
      const orden = await OrdenTrabajoModel.update(id, { estado: 'EN_PROCESO' });
      if (!orden) {
        return { data: null, error: 'Orden de trabajo no encontrada', status: 404 };
      }
      return { data: orden, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error iniciar orden-trabajo:');
      return { data: null, error: 'Error al iniciar orden de trabajo', status: 500 };
    }
  },

  async terminar(id: number) {
    try {
      const orden = await OrdenTrabajoModel.getById(id);
      if (!orden) {
        return { data: null, error: 'Orden de trabajo no encontrada', status: 404 };
      }
      const lote = await ProductoLoteModel.create({
        orden_id: id,
        cantidad_inicial: orden.cantidad_produccion,
        cantidad_actual: orden.cantidad_produccion,
        estado: 'VIGENTE'
      });
      const ordenActualizada = await OrdenTrabajoModel.update(id, { estado: 'FINALIZADA' });
      return { data: { orden: ordenActualizada, lote }, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error terminar orden-trabajo:');
      return { data: null, error: 'Error al terminar orden de trabajo', status: 500 };
    }
  }
};