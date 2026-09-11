import type { IKardexAlacenaModel } from "../../types.js";
import { kardexAlacenaTable, type SelectKardexAlacena } from "../../schemas/index.schema.js"
import { eq, ColumnAliasProxyHandler } from "drizzle-orm";
import { db } from "./db.model.js";

export const KardexAlacenaModel: IKardexAlacenaModel = {
  async getKardexAlacenaById(id: number, lote: number): Promise<SelectKardexAlacena | null> {
    try {
      const kardexAlacena = await db.select().from(kardexAlacenaTable).where(and(eq(kardexAlacenaTable.id,id), eq(kardexAlacenaTable.lote_id,lote)))
    }
    catch () {
      
    }
  }
}