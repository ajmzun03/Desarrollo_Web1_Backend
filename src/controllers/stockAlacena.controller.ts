import { StockAlacenaModel } from '../model/supabase/stockAlacena.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const StockAlacenaController = {
  async getAll(alacenaId?: number) {
    try {
      const stocks = alacenaId
        ? await StockAlacenaModel.getByAlacenaId(alacenaId)
        : await StockAlacenaModel.getAll();
      return { data: stocks, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get stock-alacena:');
      return errorDb(error, 'Error al obtener stock de alacena');
    }
  }
};