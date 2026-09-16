import { StockAlacenaModel } from '../model/supabase/stockAlacena.model.js';

export const StockAlacenaController = {
  async getAll(alacenaId?: number) {
    try {
      const stocks = alacenaId
        ? await StockAlacenaModel.getByAlacenaId(alacenaId)
        : await StockAlacenaModel.getAll();
      return { data: stocks, error: null, status: 200 };
    } catch (error) {
      console.error('Error get stock-alacena:', error);
      return { data: null, error: 'Error al obtener stock de alacena', status: 500 };
    }
  }
};