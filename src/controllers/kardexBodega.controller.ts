import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import logger from '../config/logger.js';

export const KardexBodegaController = {
  async getAll(bodegaId?: number, loteId?: number) {
    try {
      let movimientos;
      if (loteId) {
        movimientos = await KardexBodegaModel.getByLoteId(loteId);
      } else if (bodegaId) {
        movimientos = await KardexBodegaModel.getByBodegaId(bodegaId);
      } else {
        movimientos = await KardexBodegaModel.getAll();
      }
      return { data: movimientos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get kardex-bodega:');
      return { data: null, error: 'Error al obtener kardex de bodega', status: 500 };
    }
  }
};