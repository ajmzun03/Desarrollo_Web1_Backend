import { db } from '../model/supabase/db.model.js';
import { municipioTable, departamentoTable } from '../schemas/db.schema.js';
import { eq } from 'drizzle-orm';

export const MunicipiosController = {
  async getAll(departamentoId?: number) {
    try {
      let municipios;
      if (departamentoId) {
        municipios = await db.select().from(municipioTable).where(eq(municipioTable.departamento_id, Number(departamentoId)));
      } else {
        municipios = await db.select().from(municipioTable).limit(100).offset(0);
      }
      return { data: municipios, error: null, status: 200 };
    } catch (error) {
      console.error('Error get municipios:', error);
      return { data: null, error: 'Error al obtener municipios', status: 500 };
    }
  },

  async getDepartamentos() {
    try {
      const departamentos = await db.select().from(departamentoTable).limit(100).offset(0);
      return { data: departamentos, error: null, status: 200 };
    } catch (error) {
      console.error('Error get departamentos:', error);
      return { data: null, error: 'Error al obtener departamentos', status: 500 };
    }
  }
};