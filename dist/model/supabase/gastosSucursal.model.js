import { db } from "./db.model.js";
import { gastosSucursalTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const GastosSucursalModel = {
    async getAll() {
        const gastos = await db.select().from(gastosSucursalTable).limit(100).offset(0);
        if (gastos.length === 0) {
            logger.warn("No se encontraron gastos de sucursal");
            throw new Error("No se encontraron gastos de sucursal");
        }
        logger.info(`Se encontraron ${gastos.length} gastos de sucursal`);
        return gastos;
    },
    async getById(id) {
        const gasto = await db.select().from(gastosSucursalTable).where(eq(gastosSucursalTable.id, id)).limit(1);
        if (gasto.length === 0) {
            logger.warn(`Gasto de sucursal con ID ${id} no encontrado`);
            throw new Error("Gasto de sucursal no encontrado");
        }
        logger.info(`Gasto de sucursal con ID ${id} encontrado`);
        return gasto[0] || null;
    },
    async getBySucursalId(sucursalId) {
        const gastos = await db.select().from(gastosSucursalTable).where(eq(gastosSucursalTable.sucursal_id, sucursalId));
        logger.info(`Se encontraron ${gastos.length} gastos para la sucursal ${sucursalId}`);
        return gastos;
    },
    async create(data) {
        const [result] = await db.insert(gastosSucursalTable).values({ ...data }).returning();
        if (result) {
            logger.info("Gasto de sucursal creado exitosamente");
            return result;
        }
        logger.error("Error al crear el gasto de sucursal");
        throw new Error("Error al crear el gasto de sucursal");
    }
};
//# sourceMappingURL=gastosSucursal.model.js.map