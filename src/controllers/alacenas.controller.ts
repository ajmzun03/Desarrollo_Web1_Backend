import { AlacenaModel } from '../model/supabase/alacena.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexAlacenaModel } from '../model/supabase/kardexAlacena.model.js';
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
      logger.error({ error }, 'Error get alacenas:');
      return { data: null, error: 'Error al obtener alacenas', status: 500 };
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
      logger.error({ error }, 'Error get alacena:');
      return { data: null, error: 'Error al obtener alacena', status: 500 };
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
      logger.error({ error }, 'Error create alacena:');
      return { data: null, error: 'Error al crear alacena', status: 500 };
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
      logger.error({ error }, 'Error update alacena:');
      return { data: null, error: 'Error al actualizar alacena', status: 500 };
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
      logger.error({ error }, 'Error get alacenas vencimientos:');
      return { data: null, error: 'Error al obtener vencimientos del alacena', status: 500 };
    }
  },

  async merma(data: { alacena_id: number; lote_id: number; cantidad: number; tipo?: string }) {
    try {
      const lote = await LoteMateriaPrimaModel.getById(data.lote_id);
      if (!lote) {
        return { data: null, error: 'Lote no encontrado', status: 404 };
      }
      const cantidadActual = Number(lote.cantidad_actual);
      if (data.cantidad > cantidadActual) {
        return { data: null, error: `Cantidad (${data.cantidad}) mayor al disponible (${cantidadActual})`, status: 400 };
      }

      const restante = cantidadActual - data.cantidad;
      const tipo = data.tipo || 'MERMA';
      let estado = lote.estado;
      if (tipo === 'VENCIMIENTO') estado = 'VENCIDO' as any;
      else if (restante === 0) estado = 'AGOTADO' as any;
      await LoteMateriaPrimaModel.update(data.lote_id, {
        cantidad_actual: String(restante),
        estado
      });

      const movimiento = await KardexAlacenaModel.create({
        alacena_id: data.alacena_id,
        lote_id: data.lote_id,
        tipo_movimiento: tipo as any,
        cantidad: String(data.cantidad)
      });

      return { data: { movimiento, saldo_restante: restante }, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error alacena merma:');
      return { data: null, error: 'Error al registrar la merma', status: 500 };
    }
  }
};