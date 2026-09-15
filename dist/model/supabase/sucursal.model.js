import { db } from "./db.model.js";
import { sucursalTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const SucursalModel = {
    async getAll() {
        const sucursales = await db.select().from(sucursalTable).limit(100).offset(0);
        if (sucursales.length === 0) {
            logger.warn("No se encontraron sucursales");
            throw new Error("No se encontraron sucursales");
        }
        return sucursales;
    },
    async getById(id) {
        const sucursal = await db.select().from(sucursalTable).where(eq(sucursalTable.id, id));
        if (!sucursal[0]) {
            logger.warn("Sucursal no encontrada");
            throw new Error("Sucursal no encontrada");
        }
        return sucursal[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(sucursalTable).values({ ...data }).returning();
        if (result) {
            logger.info("Sucursal creada exitosamente");
            return result;
        }
        logger.error("Error al crear la sucursal");
        throw new Error("Error al crear la sucursal");
    },
    async update(id, data) {
        const [result] = await db.update(sucursalTable).set(data).where(eq(sucursalTable.id, id)).returning();
        if (result) {
            logger.info("Sucursal actualizada exitosamente");
            return result;
        }
        logger.error("Error al actualizar la sucursal");
        throw new Error("Error al actualizar la sucursal");
    }
};
//# sourceMappingURL=sucursal.model.js.map