import { db } from "./db.js"
import { direccionTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IDireccionModel } from "../../types.js";
import type { SelectDireccion, InsertDireccion, UpdateDireccion } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const DireccionModel: IDireccionModel = {
    async getAll(): Promise<SelectDireccion[]> {
        const direcciones = await db.select().from(direccionTable).limit(100).offset(0);
        if (direcciones.length === 0) {
            logger.warn("No se encontraron direcciones");
            throw new Error("No se encontraron direcciones");
        }
        logger.info(`Se encontraron ${direcciones.length} direcciones`);
        return direcciones;
    },
    async getById(id: number): Promise<SelectDireccion | null> {
        const direccion = await db.select().from(direccionTable).where(eq(direccionTable.id, id));
        if (!direccion[0]) {
            logger.warn(`Direccion con id ${id} no encontrada`);
            throw new Error("Direccion no encontrada");
        }
        logger.info(`Direccion con id ${id} encontrada`);
        return direccion[0] || null;
    },
    async create(data: InsertDireccion): Promise<SelectDireccion> {
        const [result] = await db.insert(direccionTable).values({ ...data }).returning();
        if (result) {
            logger.info("Direccion creada exitosamente");
            return result;
        }
        logger.error("Error al crear la direccion");
        throw new Error("Error al crear la direccion");
    },
    async update(id: number, data: UpdateDireccion): Promise<SelectDireccion | null> {
        const [result] = await db.update(direccionTable).set(data).where(eq(direccionTable.id, id)).returning();
        if (result) {
            logger.info(`Direccion con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar la direccion con id ${id}`);
        throw new Error("Error al actualizar la direccion");
    }
}

