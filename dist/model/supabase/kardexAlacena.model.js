import { kardexAlacenaTable } from "../../schemas/index.schema.js";
import { and, eq } from "drizzle-orm";
import { db } from "./db.model.js";
import logger from "../../config/logger.js";
export const KardexAlacenaModel = {
    async getAll() {
        try {
            const kardex = await db.select().from(kardexAlacenaTable).limit(100).offset(0);
            logger.info(`Se encontraron ${kardex.length} movimientos de kardex alacena`);
            return kardex;
        }
        catch (error) {
            logger.error(`Error al obtener el kardex de alacena: ${error}`);
            return [];
        }
    },
    async getKardexAlacenaById(id, lote) {
        try {
            const kardexAlacena = await db.select().from(kardexAlacenaTable).where(and(eq(kardexAlacenaTable.id, id), eq(kardexAlacenaTable.lote_id, lote)));
            return kardexAlacena[0] || null;
        }
        catch (error) {
            logger.error(`Error al obtener el kardex de alacena con id ${id} y lote ${lote}: ${error}`);
            return null;
        }
    },
    async getByAlacenaId(alacenaId) {
        try {
            const kardex = await db.select().from(kardexAlacenaTable).where(eq(kardexAlacenaTable.alacena_id, alacenaId));
            logger.info(`Se encontraron ${kardex.length} movimientos para la alacena ${alacenaId}`);
            return kardex;
        }
        catch (error) {
            logger.error(`Error al obtener el kardex de la alacena ${alacenaId}: ${error}`);
            return [];
        }
    }
};
//# sourceMappingURL=kardexAlacena.model.js.map