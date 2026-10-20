import { db } from "./db.model.js"
import { facturaCompraTable, hojaRecepcionTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IFacturaCompraModel } from "../../types.js";
import type { InsertFacturaCompra, SelectFacturaCompra } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const FacturaCompraModel: IFacturaCompraModel = {
  async getAll(): Promise<SelectFacturaCompra[]> {
    const facturas = await db.select().from(facturaCompraTable).limit(100).offset(0);
    logger.info(`Se encontraron ${facturas.length} facturas de compra`);
    return facturas;
  },

  async getById(id: number): Promise<SelectFacturaCompra | null> {
    const factura = await db.select().from(facturaCompraTable).where(eq(facturaCompraTable.id, id)).limit(1);
    if (factura.length === 0) {
      logger.warn(`Factura de compra con ID ${id} no encontrada`);
      throw new Error("Factura de compra no encontrada");
    }
    logger.info(`Factura de compra con ID ${id} encontrada`);
    return factura[0] || null;
  },

  async getByHojaRecepcionId(hojaRecepcionId: number): Promise<SelectFacturaCompra[]> {
    const facturas = await db.select().from(facturaCompraTable).where(eq(facturaCompraTable.hoja_recepcion_id, hojaRecepcionId));
    logger.info(`Se encontraron ${facturas.length} facturas para la hoja de recepción ${hojaRecepcionId}`);
    return facturas;
  },

  async getByOrdenCompraId(ordenCompraId: number): Promise<SelectFacturaCompra[]> {
    const facturas = await db
      .select({ factura: facturaCompraTable })
      .from(facturaCompraTable)
      .innerJoin(hojaRecepcionTable, eq(facturaCompraTable.hoja_recepcion_id, hojaRecepcionTable.id))
      .where(eq(hojaRecepcionTable.orden_compra_id, ordenCompraId));
    const lista = facturas.map((r) => r.factura);
    logger.info(`Se encontraron ${lista.length} facturas para la orden de compra ${ordenCompraId}`);
    return lista;
  },

  async create(data: InsertFacturaCompra): Promise<SelectFacturaCompra> {
    const [result] = await db.insert(facturaCompraTable).values({ ...data }).returning();
    if (result) {
      logger.info("Factura de compra creada exitosamente");
      return result;
    }
    logger.error("Error al crear la factura de compra");
    throw new Error("Error al crear la factura de compra");
  }
}