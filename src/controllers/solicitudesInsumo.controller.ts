import { SolicitudInsumoModel } from '../model/supabase/solicitudInsumo.model.js';
import logger from '../config/logger.js';

export const SolicitudesInsumoController = {
  async getAll() {
    try {
      const solicitudes = await SolicitudInsumoModel.getAll();
      return { data: solicitudes, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get solicitudes insumo:');
      return { data: null, error: 'Error al obtener solicitudes de insumos', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const solicitud = await SolicitudInsumoModel.getById(id);
      if (!solicitud) {
        return { data: null, error: 'Solicitud no encontrada', status: 404 };
      }
      const detalles = await SolicitudInsumoModel.getDetalles(id);
      return { data: { ...solicitud, detalles }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get solicitud insumo:');
      return { data: null, error: 'Error al obtener solicitud de insumo', status: 500 };
    }
  },

  async getBySucursal(sucursalId: number) {
    try {
      const solicitudes = await SolicitudInsumoModel.getBySucursalId(sucursalId);
      return { data: solicitudes, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get solicitudes por sucursal:');
      return { data: null, error: 'Error al obtener solicitudes de insumos', status: 500 };
    }
  },

  async create(data: { sucursal_id: number; items: Array<{ materia_prima_id: number; cantidad_solicitada: number }> }, userId: number) {
    try {
      if (!data.sucursal_id || !data.items || data.items.length === 0) {
        return { data: null, error: 'sucursal_id e items son requeridos', status: 400 };
      }

      const nuevaSolicitud = await SolicitudInsumoModel.create({
        sucursal_id: data.sucursal_id,
        solicitado_por: userId,
        estado: 'PENDIENTE'
      });

      const solicitudId = Number(nuevaSolicitud.id);
      const detallesCreados = [];

      for (const item of data.items) {
        const detalle = await SolicitudInsumoModel.createDetalle({
          solicitud_id: solicitudId,
          materia_prima_id: item.materia_prima_id,
          cantidad_solicitada: String(item.cantidad_solicitada)
        });
        detallesCreados.push(detalle);
      }

      return {
        data: { ...nuevaSolicitud, detalles: detallesCreados },
        error: null,
        status: 201
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error create solicitud insumo:');
      return { data: null, error: 'Error al crear solicitud de insumo', status: 500 };
    }
  },

  async updateEstado(
    id: number,
    estado: 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'CANCELADA',
    detallesRecibidos?: Array<{ id: number; cantidad_recibida: number }>
  ) {
    try {
      const solicitud = await SolicitudInsumoModel.getById(id);
      if (!solicitud) {
        return { data: null, error: 'Solicitud no encontrada', status: 404 };
      }

      const actualizada = await SolicitudInsumoModel.update(id, { estado });

      if (detallesRecibidos && detallesRecibidos.length > 0) {
        for (const det of detallesRecibidos) {
          await SolicitudInsumoModel.updateDetalleRecibido(det.id, det.cantidad_recibida);
        }
      }

      const detalles = await SolicitudInsumoModel.getDetalles(id);
      return { data: { ...actualizada, detalles }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error update estado solicitud insumo:');
      return { data: null, error: 'Error al actualizar estado de solicitud', status: 500 };
    }
  }
};
