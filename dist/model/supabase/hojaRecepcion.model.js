import { db } from "./db.model.js";
import { hojaRecepcionTable, hojaRecepcionDetalleTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const HojaRecepcionModel = {
    async getAll() {
        const hojas = await db.select().from(hojaRecepcionTable).limit(100).offset(0);
        if (hojas.length === 0) {
            logger.warn("No se encontraron hojas de recepción");
            throw new Error("No se encontraron hojas de recepción");
        }
        logger.info(`Se encontraron ${hojas.length} hojas de recepción`);
        return hojas;
    },
    async getById(id) {
        const hoja = await db.select().from(hojaRecepcionTable).where(eq(hojaRecepcionTable.id, id)).limit(1);
        if (hoja.length === 0) {
            logger.warn(`Hoja de recepción con ID ${id} no encontrada`);
            throw new Error("Hoja de recepción no encontrada");
        }
        logger.info(`Hoja de recepción con ID ${id} encontrada`);
        return hoja[0] || null;
    },
    async getBySucursalId(sucursalId) {
        const hojas = await db.select().from(hojaRecepcionTable).where(eq(hojaRecepcionTable.sucursal_receptora, sucursalId));
        logger.info(`Se encontraron ${hojas.length} hojas de recepción para la sucursal ${sucursalId}`);
        return hojas;
    },
    async create(data) {
        const [result] = await db.insert(hojaRecepcionTable).values({ ...data }).returning();
        if (result) {
            logger.info("Hoja de recepción creada exitosamente");
            return result;
        }
        logger.error("Error al crear la hoja de recepción");
        throw new Error("Error al crear la hoja de recepción");
    },
    async update(id, data) {
        const [result] = await db.update(hojaRecepcionTable).set(data).where(eq(hojaRecepcionTable.id, id)).returning();
        if (result) {
            logger.info(`Hoja de recepción con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar la hoja de recepción con id ${id}`);
        throw new Error("Error al actualizar la hoja de recepción");
    }
};
export const HojaRecepcionDetalleModel = {
    async getByHojaRecepcionId(hojaRecepcionId) {
        const detalles = await db.select().from(hojaRecepcionDetalleTable).where(eq(hojaRecepcionDetalleTable.hoja_recepcion_id, hojaRecepcionId));
        logger.info(`Se encontraron ${detalles.length} detalles para la hoja de recepción ${hojaRecepcionId}`);
        return detalles;
    },
    async create(data) {
        const [result] = await db.insert(hojaRecepcionDetalleTable).values({ ...data }).returning();
        if (result) {
            logger.info("Detalle de hoja de recepción creado exitosamente");
            return result;
        }
        logger.error("Error al crear el detalle de hoja de recepción");
        throw new Error("Error al crear el detalle de hoja de recepción");
    }
};
//# sourceMappingURL=hojaRecepcion.model.js.map