import { db } from '../model/supabase/db.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
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
      logger.error({ err: error }, 'Error get municipios:');
      return errorDb(error, 'Error al obtener municipios');
    }
  },

  async getDepartamentos() {
    try {
      const departamentos = await db.select().from(departamentoTable).limit(100).offset(0);
      return { data: departamentos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get departamentos:');
      return errorDb(error, 'Error al obtener departamentos');
    }
  }
};