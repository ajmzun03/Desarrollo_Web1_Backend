import { AlacenaModel } from '../model/supabase/alacena.model.js';

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
      console.error('Error get alacenas:', error);
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
      console.error('Error get alacena:', error);
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
      console.error('Error create alacena:', error);
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
      console.error('Error update alacena:', error);
      return { data: null, error: 'Error al actualizar alacena', status: 500 };
    }
  }
};