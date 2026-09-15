import { db } from "./db.model.js"
import { facturaVentaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IFacturaVentaModel } from "../../types.js";
import type { InsertFacturaVenta, SelectFacturaVenta } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const FacturaVentaModel: IFacturaVentaModel = {
  async getAll(): Promise<SelectFacturaVenta[]> {
    const facturas = await db.select().from(facturaVentaTable).limit(100).offset(0);
    if (facturas.length === 0) {
      logger.warn("No se encontraron facturas de venta");
      throw new Error("No se encontraron facturas de venta");
    }
    logger.info(`Se encontraron ${facturas.length} facturas de venta`);
    return facturas;
  },

  async getById(id: number): Promise<SelectFacturaVenta | null> {
    const factura = await db.select().from(facturaVentaTable).where(eq(facturaVentaTable.id, id)).limit(1);
    if (factura.length === 0) {
      logger.warn(`Factura de venta con ID ${id} no encontrada`);
      throw new Error("Factura de venta no encontrada");
    }
    logger.info(`Factura de venta con ID ${id} encontrada`);
    return factura[0] || null;
  },

  async getByPedidoId(pedidoId: number): Promise<SelectFacturaVenta[]> {
    const facturas = await db.select().from(facturaVentaTable).where(eq(facturaVentaTable.pedido_id, pedidoId));
    logger.info(`Se encontraron ${facturas.length} facturas para el pedido ${pedidoId}`);
    return facturas;
  },

  async create(data: InsertFacturaVenta): Promise<SelectFacturaVenta> {
    const [result] = await db.insert(facturaVentaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Factura de venta creada exitosamente");
      return result;
    }
    logger.error("Error al crear la factura de venta");
    throw new Error("Error al crear la factura de venta");
  }
}