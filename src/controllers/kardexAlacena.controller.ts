import { KardexAlacenaModel } from '../model/supabase/kardexAlacena.model.js';

export const KardexAlacenaController = {
  async getAll(alacenaId?: number) {
    try {
      const movimientos = alacenaId
        ? await KardexAlacenaModel.getByAlacenaId(alacenaId)
        : await KardexAlacenaModel.getAll();
      return { data: movimientos, error: null, status: 200 };
    } catch (error) {
      console.error('Error get kardex-alacena:', error);
      return { data: null, error: 'Error al obtener kardex de alacena', status: 500 };
    }
  }
};