import { StockAlacenaModel } from '../model/supabase/stockAlacena.model.js';
import logger from '../config/logger.js';

export const StockAlacenaController = {
  async getAll(alacenaId?: number) {
    try {
      const stocks = alacenaId
        ? await StockAlacenaModel.getByAlacenaId(alacenaId)
        : await StockAlacenaModel.getAll();
      return { data: stocks, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get stock-alacena:');
      return { data: null, error: 'Error al obtener stock de alacena', status: 500 };
    }
  }
};