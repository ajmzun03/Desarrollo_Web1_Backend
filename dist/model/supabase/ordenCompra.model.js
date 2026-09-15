import { db } from "./db.model.js";
import { ordenCompraTable, detalleOrdenCompraTable } from "../../schemas/db.schema.js";
import { eq, and } from "drizzle-orm";
import logger from "../../config/logger.js";
export const OrdenCompraModel = {
    async getAll() {
        const ordenes = await db.select().from(ordenCompraTable).limit(100).offset(0);
        if (ordenes.length === 0) {
            logger.warn("No se encontraron órdenes de compra");
            throw new Error("No se encontraron órdenes de compra");
        }
        logger.info(`Se encontraron ${ordenes.length} órdenes de compra`);
        return ordenes;
    },
    async getById(id) {
        const orden = await db.select().from(ordenCompraTable).where(eq(ordenCompraTable.id, id)).limit(1);
        if (orden.length === 0) {
            logger.warn(`Orden de compra con ID ${id} no encontrada`);
            throw new Error("Orden de compra no encontrada");
        }
        logger.info(`Orden de compra con ID ${id} encontrada`);
        return orden[0] || null;
    },
    async getByEstado(estado) {
        const ordenes = await db.select().from(ordenCompraTable).where(eq(ordenCompraTable.estado_orden, estado));
        logger.info(`Se encontraron ${ordenes.length} órdenes de compra con estado ${estado}`);
        return ordenes;
    },
    async getBySucursalId(sucursalId) {
        const ordenes = await db.select().from(ordenCompraTable).where(eq(ordenCompraTable.sucursal_destino, sucursalId));
        logger.info(`Se encontraron ${ordenes.length} órdenes de compra para la sucursal ${sucursalId}`);
        return ordenes;
    },
    async create(data) {
        const [result] = await db.insert(ordenCompraTable).values({ ...data }).returning();
        if (result) {
            logger.info("Orden de compra creada exitosamente");
            return result;
        }
        logger.error("Error al crear la orden de compra");
        throw new Error("Error al crear la orden de compra");
    },
    async update(id, data) {
        const [result] = await db.update(ordenCompraTable).set(data).where(eq(ordenCompraTable.id, id)).returning();
        if (result) {
            logger.info(`Orden de compra con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar la orden de compra con id ${id}`);
        throw new Error("Error al actualizar la orden de compra");
    }
};
export const DetalleOrdenCompraModel = {
    async getByOrdenCompraId(ordenCompraId) {
        const detalles = await db.select().from(detalleOrdenCompraTable).where(eq(detalleOrdenCompraTable.orden_compra_id, ordenCompraId));
        logger.info(`Se encontraron ${detalles.length} detalles para la orden de compra ${ordenCompraId}`);
        return detalles;
    },
    async create(data) {
        const [result] = await db.insert(detalleOrdenCompraTable).values({ ...data }).returning();
        if (result) {
            logger.info("Detalle de orden de compra creado exitosamente");
            return result;
        }
        logger.error("Error al crear el detalle de orden de compra");
        throw new Error("Error al crear el detalle de orden de compra");
    }
};
//# sourceMappingURL=ordenCompra.model.js.map