import { db } from "./db.model.js";
import { kardexBodegaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const KardexBodegaModel = {
    async getAll() {
        const kardex = await db.select().from(kardexBodegaTable).limit(100).offset(0);
        logger.info(`Se encontraron ${kardex.length} movimientos de kardex bodega`);
        return kardex;
    },
    async getByBodegaId(bodegaId) {
        const kardex = await db.select().from(kardexBodegaTable).where(eq(kardexBodegaTable.bodega_id, bodegaId));
        logger.info(`Se encontraron ${kardex.length} movimientos para la bodega ${bodegaId}`);
        return kardex;
    },
    async getByLoteId(loteId) {
        const kardex = await db.select().from(kardexBodegaTable).where(eq(kardexBodegaTable.lote_id, loteId));
        logger.info(`Se encontraron ${kardex.length} movimientos para el lote ${loteId}`);
        return kardex;
    },
    async create(data) {
        const [result] = await db.insert(kardexBodegaTable).values({ ...data }).returning();
        if (result) {
            logger.info("Movimiento de kardex bodega creado exitosamente");
            return result;
        }
        logger.error("Error al crear el movimiento de kardex bodega");
        throw new Error("Error al crear el movimiento de kardex bodega");
    }
};
//# sourceMappingURL=kardexBodega.model.js.map