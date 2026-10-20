import { LiquidacionRepartidorModel } from '../model/supabase/liquidacionRepartidor.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import type { DecodedToken } from '../jwt.js';

export const LiquidacionesController = {
  async getAll(turnoId?: number) {
    try {
      const liquidaciones = turnoId
        ? await LiquidacionRepartidorModel.getByTurnoId(turnoId)
        : await LiquidacionRepartidorModel.getAll();
      return { data: liquidaciones, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'No se encontraron liquidaciones de repartidor') {
        return { data: [], error: null, status: 200 };
      }
      logger.error({ err: error }, 'Error get liquidaciones:');
      return errorDb(error, 'Error al obtener liquidaciones');
    }
  },

  async getById(id: number) {
    try {
      const liquidacion = await LiquidacionRepartidorModel.getById(id);
      return { data: liquidacion, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Liquidación de repartidor no encontrada') {
        return { data: null, error: 'Liquidación de repartidor no encontrada', status: 404 };
      }
      logger.error({ err: error }, 'Error get liquidacion:');
      return errorDb(error, 'Error al obtener liquidación');
    }
  },

  async create(data: { turno_id: number; repartidor_id?: number | undefined; monto_entregado_repartidor?: number | undefined; monto_recaudado_efectivo?: number | undefined; monto_recaudado_voucher?: number | undefined }, user: DecodedToken) {
    try {
      // Un REPARTIDOR liquida siempre a su nombre; el ADMIN debe indicar el repartidor
      const repartidorId = user.rol === 'REPARTIDOR' ? Number(user.id) : data.repartidor_id;
      if (!data.turno_id || !repartidorId) {
        return { data: null, error: 'turno_id y repartidor_id son requeridos', status: 400 };
      }
      const nuevaLiquidacion = await LiquidacionRepartidorModel.create({
        turno_id: data.turno_id,
        repartidor_id: repartidorId,
        monto_entregado_repartidor: data.monto_entregado_repartidor == null ? undefined : String(data.monto_entregado_repartidor),
        monto_recaudado_efectivo: data.monto_recaudado_efectivo == null ? undefined : String(data.monto_recaudado_efectivo),
        monto_recaudado_voucher: data.monto_recaudado_voucher == null ? undefined : String(data.monto_recaudado_voucher)
      });
      return { data: nuevaLiquidacion, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create liquidacion:');
      return errorDb(error, 'Error al crear liquidación');
    }
  }
};