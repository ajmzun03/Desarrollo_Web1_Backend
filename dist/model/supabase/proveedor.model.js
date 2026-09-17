import { db } from "./db.model.js";
import { proveedorTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const ProveedorModel = {
    async getAll() {
        const proveedores = await db.select().from(proveedorTable).limit(100).offset(0);
        if (proveedores.length === 0) {
            logger.warn("No se encontraron proveedores");
            throw new Error("No se encontraron proveedores");
        }
        logger.info(`Se encontraron ${proveedores.length} proveedores`);
        return proveedores;
    },
    async getById(id) {
        const proveedor = await db.select().from(proveedorTable).where(eq(proveedorTable.id, id));
        if (!proveedor[0]) {
            logger.warn(`Proveedor con id ${id} no encontrado`);
            throw new Error("Proveedor no encontrado");
        }
        return proveedor[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(proveedorTable).values({ ...data }).returning();
        if (result) {
            logger.info("Proveedor creado exitosamente");
            return result;
        }
        logger.error("Error al crear el proveedor");
        throw new Error("Error al crear el proveedor");
    },
    async update(data) {
        if (data.id !== undefined) {
            const [result] = await db.update(proveedorTable).set(data).where(eq(proveedorTable.id, data.id)).returning();
            if (result) {
                logger.info(`Proveedor con id ${data.id} actualizado exitosamente`);
                return result;
            }
        }
        logger.error("Error al actualizar el proveedor");
        throw new Error("Error al actualizar el proveedor");
    }
};
//# sourceMappingURL=proveedor.model.js.map