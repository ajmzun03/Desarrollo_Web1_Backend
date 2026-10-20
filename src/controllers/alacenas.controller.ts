import { AlacenaModel } from '../model/supabase/alacena.model.js';
import { errorDb } from '../utils/errors.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { mermaAlacena, type MermaAlacenaInput } from '../services/inventario.service.js';
import logger from '../config/logger.js';

export const AlacenasController = {
  async getAll(bodegaId?: number) {
    try {
      let alacenas;
      if (bodegaId) {
        alacenas = await AlacenaModel.getByBodegaId(bodegaId);
      } else {
        alacenas = await AlacenaModel.getAll();
      }
      return { data: alacenas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get alacenas:');
      return errorDb(error, 'Error al obtener alacenas');
    }
  },

  async getById(id: number) {
    try {
      const alacena = await AlacenaModel.getById(id);
      if (!alacena) {
        return { data: null, error: 'Alacena no encontrada', status: 404 };
      }
      return { data: alacena, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get alacena:');
      return errorDb(error, 'Error al obtener alacena');
    }
  },

  async create(data: { bodega_id?: number; alacena: string }) {
    try {
      if (!data.alacena) {
        return { data: null, error: 'alacena es requerido', status: 400 };
      }
      const nuevaAlacena = await AlacenaModel.create(data);
      return { data: nuevaAlacena, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create alacena:');
      return errorDb(error, 'Error al crear alacena');
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const alacena = await AlacenaModel.update(id, data);
      if (!alacena) {
        return { data: null, error: 'Alacena no encontrada', status: 404 };
      }
      return { data: alacena, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update alacena:');
      return errorDb(error, 'Error al actualizar alacena');
    }
  },

  async getVencimientos(alacenaId?: number, dias?: number) {
    try {
      if (!alacenaId) {
        return { data: null, error: 'alacena_id es requerido', status: 400 };
      }
      const lotes = await LoteMateriaPrimaModel.getVencimientosPorAlacena(alacenaId, dias ?? 7);
      return { data: lotes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get alacenas vencimientos:');
      return errorDb(error, 'Error al obtener vencimientos del alacena');
    }
  },

  async merma(data: { alacena_id: number; lote_id: number; cantidad: number; tipo?: string | undefined }) {
    try {
      const resultado = await mermaAlacena({
        alacena_id: data.alacena_id,
        lote_id: data.lote_id,
        cantidad: data.cantidad,
        tipo: data.tipo as MermaAlacenaInput['tipo']
      });
      return { data: resultado, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error alacena merma:');
      return errorDb(error, 'Error al registrar la merma');
    }
  }
};
