import { stockAlacenaTable } from "../../schemas/index.schema.js";
import logger from "../../config/logger.js";
import { db } from "./db.model.js";
import { and, eq } from "drizzle-orm";
export const StockAlacenaModel = {
    async getAlacenaById(id, lote) {
        try {
            const stockAlacena = await db.select().from(stockAlacenaTable).where(and(eq(stockAlacenaTable.id, id), eq(stockAlacenaTable.lote_id, lote)));
            return stockAlacena[0] || null;
        }
        catch (error) {
            logger.error(`Error al obtener el stock de alacena con id ${id} y lote ${lote}: ${error}`);
            return null;
        }
    }
};
//# sourceMappingURL=stockAlacena.model.js.map