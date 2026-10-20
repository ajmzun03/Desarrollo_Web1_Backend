import { BodegaModel } from '../model/supabase/bodega.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';

export const BodegasController = {
  async getAll(sucursalId?: number) {
    try {
      let bodegas;
      if (sucursalId) {
        bodegas = await BodegaModel.getBySucursalId(sucursalId);
      } else {
        bodegas = await BodegaModel.getAll();
      }
      return { data: bodegas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get bodegas:');
      return errorDb(error, 'Error al obtener bodegas');
    }
  },

  async getById(id: number) {
    try {
      const bodega = await BodegaModel.getById(id);
      if (!bodega) {
        return { data: null, error: 'Bodega no encontrada', status: 404 };
      }
      return { data: bodega, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get bodega:');
      return errorDb(error, 'Error al obtener bodega');
    }
  },

  async create(data: { sucursal_id: number; bodega: string }) {
    try {
      if (!data.sucursal_id || !data.bodega) {
        return { data: null, error: 'sucursal_id y bodega son requeridos', status: 400 };
      }
      const nuevaBodega = await BodegaModel.create(data);
      return { data: nuevaBodega, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create bodega:');
      return errorDb(error, 'Error al crear bodega');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const bodega = await BodegaModel.update(id, data);
      if (!bodega) {
        return { data: null, error: 'Bodega no encontrada', status: 404 };
      }
      return { data: bodega, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update bodega:');
      return errorDb(error, 'Error al actualizar bodega');
    }
  },

  async getLotesFEFO(bodegaId?: number, materiaPrimaId?: number) {
    try {
      if (!materiaPrimaId) {
        return { data: null, error: 'materia_prima_id es requerido', status: 400 };
      }
      const lotes = await LoteMateriaPrimaModel.getFEFO(Number(bodegaId) || 0, Number(materiaPrimaId));
      return { data: lotes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get lotes FEFO:');
      return errorDb(error, 'Error al obtener lotes FEFO');
    }
  }
};