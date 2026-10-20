import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const StockBodegaController = {
  async getAll(bodegaId?: number) {
    try {
      const stocks = bodegaId
        ? await StockBodegaModel.getByBodegaId(bodegaId)
        : await StockBodegaModel.getAll();
      return { data: stocks, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get stock-bodega:');
      return errorDb(error, 'Error al obtener stock de bodega');
    }
  }
};