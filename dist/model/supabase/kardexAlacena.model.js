import { kardexAlacenaTable } from "../../schemas/index.schema.js";
import { and, eq } from "drizzle-orm";
import { db } from "./db.model.js";
import logger from "../../config/logger.js";
export const KardexAlacenaModel = {
    async getKardexAlacenaById(id, lote) {
        try {
            const kardexAlacena = await db.select().from(kardexAlacenaTable).where(and(eq(kardexAlacenaTable.id, id), eq(kardexAlacenaTable.lote_id, lote)));
            return kardexAlacena[0] || null;
        }
        catch (error) {
            logger.error(`Error al obtener el kardex de alacena con id ${id} y lote ${lote}: ${error}`);
            return null;
        }
    }
};
//# sourceMappingURL=kardexAlacena.model.js.map