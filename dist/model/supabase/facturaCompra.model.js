import { db } from "./db.model.js";
import { facturaCompraTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const FacturaCompraModel = {
    async getAll() {
        const facturas = await db.select().from(facturaCompraTable).limit(100).offset(0);
        if (facturas.length === 0) {
            logger.warn("No se encontraron facturas de compra");
            throw new Error("No se encontraron facturas de compra");
        }
        logger.info(`Se encontraron ${facturas.length} facturas de compra`);
        return facturas;
    },
    async getById(id) {
        const factura = await db.select().from(facturaCompraTable).where(eq(facturaCompraTable.id, id)).limit(1);
        if (factura.length === 0) {
            logger.warn(`Factura de compra con ID ${id} no encontrada`);
            throw new Error("Factura de compra no encontrada");
        }
        logger.info(`Factura de compra con ID ${id} encontrada`);
        return factura[0] || null;
    },
    async getByHojaRecepcionId(hojaRecepcionId) {
        const facturas = await db.select().from(facturaCompraTable).where(eq(facturaCompraTable.hoja_recepcion_id, hojaRecepcionId));
        logger.info(`Se encontraron ${facturas.length} facturas para la hoja de recepción ${hojaRecepcionId}`);
        return facturas;
    },
    async create(data) {
        const [result] = await db.insert(facturaCompraTable).values({ ...data }).returning();
        if (result) {
            logger.info("Factura de compra creada exitosamente");
            return result;
        }
        logger.error("Error al crear la factura de compra");
        throw new Error("Error al crear la factura de compra");
    }
};
//# sourceMappingURL=facturaCompra.model.js.map