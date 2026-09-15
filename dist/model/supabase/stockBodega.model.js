import { db } from "./db.model.js";
import { stockBodegaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const StockBodegaModel = {
    async getAll() {
        const stocks = await db.select().from(stockBodegaTable).limit(100).offset(0);
        logger.info(`Se encontraron ${stocks.length} registros de stock bodega`);
        return stocks;
    },
    async getByBodegaId(bodegaId) {
        const stocks = await db.select().from(stockBodegaTable).where(eq(stockBodegaTable.bodega_id, bodegaId));
        logger.info(`Se encontraron ${stocks.length} stocks para la bodega ${bodegaId}`);
        return stocks;
    },
    async create(data) {
        const [result] = await db.insert(stockBodegaTable).values({ ...data }).returning();
        if (result) {
            logger.info("Stock bodega creado exitosamente");
            return result;
        }
        logger.error("Error al crear el stock bodega");
        throw new Error("Error al crear el stock bodega");
    }
};
//# sourceMappingURL=stockBodega.model.js.map