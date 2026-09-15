import type { IKardexAlacenaModel } from "../../types.js";
import { kardexAlacenaTable, type SelectKardexAlacena } from "../../schemas/index.schema.js";
import { and, eq } from "drizzle-orm";
import { db } from "./db.model.js";
import logger from "../../config/logger.js";

export const KardexAlacenaModel: IKardexAlacenaModel = {
  async getKardexAlacenaById(id: number, lote: number): Promise<SelectKardexAlacena | null> {
    try {
      const kardexAlacena = await db.select().from(kardexAlacenaTable).where(and(eq(kardexAlacenaTable.id, id), eq(kardexAlacenaTable.lote_id, lote)));
      return kardexAlacena[0] || null;
    } catch (error) {
      logger.error(`Error al obtener el kardex de alacena con id ${id} y lote ${lote}: ${error}`);
      return null;
    }
  }
}