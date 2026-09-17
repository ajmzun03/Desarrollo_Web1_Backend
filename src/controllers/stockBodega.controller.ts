import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';

export const StockBodegaController = {
  async getAll(bodegaId?: number) {
    try {
      const stocks = bodegaId
        ? await StockBodegaModel.getByBodegaId(bodegaId)
        : await StockBodegaModel.getAll();
      return { data: stocks, error: null, status: 200 };
    } catch (error) {
      console.error('Error get stock-bodega:', error);
      return { data: null, error: 'Error al obtener stock de bodega', status: 500 };
    }
  }
};