import { SolicitudInsumoModel } from '../model/supabase/solicitudInsumo.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { eq, and } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import { solicitudInsumoTable, detalleSolicitudInsumoTable } from '../schemas/db.schema.js';
import { ErrorNegocio } from '../utils/errors.js';
import { TRANSICIONES_SOLICITUD_INSUMO, validarTransicion } from '../utils/transiciones.js';

export const SolicitudesInsumoController = {
  async getAll() {
    try {
      const solicitudes = await SolicitudInsumoModel.getAll();
      return { data: solicitudes, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get solicitudes insumo:');
      return errorDb(error, 'Error al obtener solicitudes de insumos');
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
      logger.error({ err: error }, 'Error get solicitud insumo:');
      return errorDb(error, 'Error al obtener solicitud de insumo');
    }
  },

  async getBySucursal(sucursalId: number) {
    try {
      const solicitudes = await SolicitudInsumoModel.getBySucursalId(sucursalId);
      return { data: solicitudes, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error get solicitudes por sucursal:');
      return errorDb(error, 'Error al obtener solicitudes de insumos');
    }
  },

  async create(data: { sucursal_id: number; items: Array<{ materia_prima_id: number; cantidad_solicitada: number }> }, userId: number) {
    try {
      if (!data.sucursal_id || !data.items || data.items.length === 0) {
        return { data: null, error: 'sucursal_id e items son requeridos', status: 400 };
      }
      if (!Number.isInteger(userId) || userId <= 0) {
        return { data: null, error: 'Usuario no identificado', status: 401 };
      }

      // Cabecera y detalles en una sola transacción: no quedan solicitudes sin detalle si algo falla
      const resultado = await db.transaction(async (tx) => {
        const [solicitud] = await tx.insert(solicitudInsumoTable).values({
          sucursal_id: data.sucursal_id,
          solicitado_por: userId,
          estado: 'PENDIENTE'
        }).returning();
        if (!solicitud) throw new Error('Error al crear la solicitud');
        const detalles = await tx.insert(detalleSolicitudInsumoTable).values(
          data.items.map(item => ({
            solicitud_id: Number(solicitud.id),
            materia_prima_id: item.materia_prima_id,
            cantidad_solicitada: String(item.cantidad_solicitada)
          }))
        ).returning();
        return { ...solicitud, detalles };
      });
      return { data: resultado, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create solicitud insumo:');
      return errorDb(error, 'Error al crear solicitud de insumo');
    }
  },

  async updateEstado(
    id: number,
    estado: 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'CANCELADA',
    detallesRecibidos?: Array<{ id: number; cantidad_recibida: number }>
  ) {
    try {
      const resultado = await db.transaction(async (tx) => {
        const [solicitud] = await tx.select().from(solicitudInsumoTable)
          .where(eq(solicitudInsumoTable.id, id)).limit(1).for('update');
        if (!solicitud) throw new ErrorNegocio('Solicitud no encontrada', 404);
        validarTransicion(TRANSICIONES_SOLICITUD_INSUMO, solicitud.estado, estado, 'la solicitud');

        // Las cantidades recibidas solo tienen sentido al recibir, y cada detalle debe ser de esta solicitud
        if (detallesRecibidos && detallesRecibidos.length > 0) {
          if (estado !== 'RECIBIDA') {
            throw new ErrorNegocio('detalles_recibidos solo se envía al marcar la solicitud como RECIBIDA', 400);
          }
          for (const det of detallesRecibidos) {
            const actualizados = await tx.update(detalleSolicitudInsumoTable)
              .set({ cantidad_recibida: String(det.cantidad_recibida) })
              .where(and(eq(detalleSolicitudInsumoTable.id, det.id), eq(detalleSolicitudInsumoTable.solicitud_id, id)))
              .returning();
            if (actualizados.length === 0) {
              throw new ErrorNegocio(`El detalle ${det.id} no pertenece a la solicitud ${id}`, 400);
            }
          }
        }

        const [actualizada] = await tx.update(solicitudInsumoTable).set({ estado })
          .where(eq(solicitudInsumoTable.id, id)).returning();
        const detalles = await tx.select().from(detalleSolicitudInsumoTable)
          .where(eq(detalleSolicitudInsumoTable.solicitud_id, id));
        return { ...actualizada, detalles };
      });
      return { data: resultado, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update estado solicitud insumo:');
      return errorDb(error, 'Error al actualizar estado de solicitud');
    }
  }
};
