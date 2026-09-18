import { stockAlacenaTable } from "../../schemas/index.schema.js";
import logger from "../../config/logger.js";
import { db } from "./db.model.js";
import { and, eq } from "drizzle-orm";
export const StockAlacenaModel = {
    async getAll() {
        try {
            const stocks = await db.select().from(stockAlacenaTable).limit(100).offset(0);
            logger.info(`Se encontraron ${stocks.length} registros de stock alacena`);
            return stocks;
        }
        catch (error) {
            logger.error(`Error al obtener el stock de alacena: ${error}`);
            return [];
        }
    },
    async getAlacenaById(id, lote) {
        try {
            const stockAlacena = await db.select().from(stockAlacenaTable).where(and(eq(stockAlacenaTable.id, id), eq(stockAlacenaTable.lote_id, lote)));
            return stockAlacena[0] || null;
        }
        catch (error) {
            logger.error(`Error al obtener el stock de alacena con id ${id} y lote ${lote}: ${error}`);
            return null;
        }
    },
    async getByAlacenaId(alacenaId) {
        try {
            const stocks = await db.select().from(stockAlacenaTable).where(eq(stockAlacenaTable.alacena_id, alacenaId));
            logger.info(`Se encontraron ${stocks.length} stocks para la alacena ${alacenaId}`);
            return stocks;
        }
        catch (error) {
            logger.error(`Error al obtener el stock de la alacena ${alacenaId}: ${error}`);
            return [];
        }
    }
};
//# sourceMappingURL=stockAlacena.model.js.map