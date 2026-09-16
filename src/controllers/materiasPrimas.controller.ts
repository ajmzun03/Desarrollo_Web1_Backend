import { MateriaPrimaModel } from '../model/supabase/materiaPrima.model.js';

export const MateriasPrimasController = {
  async getAll() {
    try {
      const materias = await MateriaPrimaModel.getAll();
      return { data: materias, error: null, status: 200 };
    } catch (error) {
      console.error('Error get materias-primas:', error);
      return { data: null, error: 'Error al obtener materias primas', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const materia = await MateriaPrimaModel.getById(id);
      if (!materia) {
        return { data: null, error: 'Materia prima no encontrada', status: 404 };
      }
      return { data: materia, error: null, status: 200 };
    } catch (error) {
      console.error('Error get materia:', error);
      return { data: null, error: 'Error al obtener materia prima', status: 500 };
    }
  },

  async create(data: { categoria_id: number; unidad_medida_id: number; materia_prima: string; es_perecedera?: boolean; maneja_merma?: boolean }) {
    try {
      if (!data.categoria_id || !data.unidad_medida_id || !data.materia_prima) {
        return { data: null, error: 'categoria_id, unidad_medida_id y materia_prima son requeridos', status: 400 };
      }
      const nuevaMateria = await MateriaPrimaModel.create({
        ...data,
        es_perecedera: data.es_perecedera ?? false,
        maneja_merma: data.maneja_merma ?? false
      });
      return { data: nuevaMateria, error: null, status: 201 };
    } catch (error) {
      console.error('Error create materia:', error);
      return { data: null, error: 'Error al crear materia prima', status: 500 };
    }
  },

  async update(id: number, data: Record<string, any>) {
    try {
      const materia = await MateriaPrimaModel.update(id, data);
      if (!materia) {
        return { data: null, error: 'Materia prima no encontrada', status: 404 };
      }
      return { data: materia, error: null, status: 200 };
    } catch (error) {
      console.error('Error update materia:', error);
      return { data: null, error: 'Error al actualizar materia prima', status: 500 };
    }
  }
};