import { db } from "./db.model.js"
import { productoLoteTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IProductoLoteModel } from "../../types.js";
import type { InsertProductoLote, SelectProductoLote, UpdateProductoLote } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const ProductoLoteModel: IProductoLoteModel = {
  async getAll(): Promise<SelectProductoLote[]> {
    const lotes = await db.select().from(productoLoteTable).limit(100).offset(0);
    if (lotes.length === 0) {
      logger.warn("No se encontraron lotes de producto");
      throw new Error("No se encontraron lotes de producto");
    }
    logger.info(`Se encontraron ${lotes.length} lotes de producto`);
    return lotes;
  },

  async getById(id: number): Promise<SelectProductoLote | null> {
    const lote = await db.select().from(productoLoteTable).where(eq(productoLoteTable.id, id)).limit(1);
    if (lote.length === 0) {
      logger.warn(`Lote de producto con ID ${id} no encontrado`);
      throw new Error("Lote de producto no encontrado");
    }
    logger.info(`Lote de producto con ID ${id} encontrado`);
    return lote[0] || null;
  },

  async getByOrdenId(ordenId: number): Promise<SelectProductoLote[]> {
    const lotes = await db.select().from(productoLoteTable).where(eq(productoLoteTable.orden_id, ordenId));
    logger.info(`Se encontraron ${lotes.length} lotes de producto para la orden ${ordenId}`);
    return lotes;
  },

  async create(data: InsertProductoLote): Promise<SelectProductoLote> {
    const [result] = await db.insert(productoLoteTable).values({ ...data }).returning();
    if (result) {
      logger.info("Lote de producto creado exitosamente");
      return result;
    }
    logger.error("Error al crear el lote de producto");
    throw new Error("Error al crear el lote de producto");
  },

  async update(id: number, data: UpdateProductoLote): Promise<SelectProductoLote | null> {
    const [result] = await db.update(productoLoteTable).set(data).where(eq(productoLoteTable.id, id)).returning();
    if (result) {
      logger.info(`Lote de producto con id ${id} actualizado exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar el lote de producto con id ${id}`);
    throw new Error("Error al actualizar el lote de producto");
  }
}