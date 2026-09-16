import { LiquidacionRepartidorModel } from '../model/supabase/liquidacionRepartidor.model.js';

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
      console.error('Error get liquidaciones:', error);
      return { data: null, error: 'Error al obtener liquidaciones', status: 500 };
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
      console.error('Error get liquidacion:', error);
      return { data: null, error: 'Error al obtener liquidación', status: 500 };
    }
  },

  async create(data: { turno_id: number; repartidor_id: number; monto_entregado_repartidor?: number; monto_recaudado_efectivo?: number; monto_recaudado_voucher?: number }) {
    try {
      if (!data.turno_id || !data.repartidor_id) {
        return { data: null, error: 'turno_id y repartidor_id son requeridos', status: 400 };
      }
      const nuevaLiquidacion = await LiquidacionRepartidorModel.create(data);
      return { data: nuevaLiquidacion, error: null, status: 201 };
    } catch (error) {
      console.error('Error create liquidacion:', error);
      return { data: null, error: 'Error al crear liquidación', status: 500 };
    }
  }
};