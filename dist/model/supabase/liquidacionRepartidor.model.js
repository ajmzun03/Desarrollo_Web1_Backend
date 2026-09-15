import { db } from "./db.model.js";
import { liquidacionRepartidorTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const LiquidacionRepartidorModel = {
    async getAll() {
        const liquidaciones = await db.select().from(liquidacionRepartidorTable).limit(100).offset(0);
        if (liquidaciones.length === 0) {
            logger.warn("No se encontraron liquidaciones de repartidor");
            throw new Error("No se encontraron liquidaciones de repartidor");
        }
        logger.info(`Se encontraron ${liquidaciones.length} liquidaciones de repartidor`);
        return liquidaciones;
    },
    async getById(id) {
        const liquidacion = await db.select().from(liquidacionRepartidorTable).where(eq(liquidacionRepartidorTable.id, id)).limit(1);
        if (liquidacion.length === 0) {
            logger.warn(`Liquidación de repartidor con ID ${id} no encontrada`);
            throw new Error("Liquidación de repartidor no encontrada");
        }
        logger.info(`Liquidación de repartidor con ID ${id} encontrada`);
        return liquidacion[0] || null;
    },
    async getByTurnoId(turnoId) {
        const liquidaciones = await db.select().from(liquidacionRepartidorTable).where(eq(liquidacionRepartidorTable.turno_id, turnoId));
        logger.info(`Se encontraron ${liquidaciones.length} liquidaciones para el turno ${turnoId}`);
        return liquidaciones;
    },
    async create(data) {
        const [result] = await db.insert(liquidacionRepartidorTable).values({ ...data }).returning();
        if (result) {
            logger.info("Liquidación de repartidor creada exitosamente");
            return result;
        }
        logger.error("Error al crear la liquidación de repartidor");
        throw new Error("Error al crear la liquidación de repartidor");
    }
};
//# sourceMappingURL=liquidacionRepartidor.model.js.map