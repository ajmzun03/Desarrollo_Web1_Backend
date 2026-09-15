import { db } from "./db.model.js"
import { bodegaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IBodegaModel } from "../../types.js";
import type { InsertBodega, SelectBodega, UpdateBodega } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const BodegaModel: IBodegaModel = {
  async getAll(): Promise<SelectBodega[]> {
    const bodegas = await db.select().from(bodegaTable).limit(100).offset(0);
    if (bodegas.length === 0) {
      logger.warn("No se encontraron bodegas");
      throw new Error("No se encontraron bodegas");
    }
    logger.info(`Se encontraron ${bodegas.length} bodegas`);
    return bodegas;
  },

  async getById(id: number): Promise<SelectBodega | null> {
    const bodega = await db.select().from(bodegaTable).where(eq(bodegaTable.id, id)).limit(1);
    if (bodega.length === 0) {
      logger.warn(`Bodega con ID ${id} no encontrada`);
      throw new Error("Bodega no encontrada");
    }
    logger.info(`Bodega con ID ${id} encontrada`);
    return bodega[0] || null;
  },

  async getBySucursalId(sucursalId: number): Promise<SelectBodega[]> {
    const bodega = await db.select().from(bodegaTable).where(eq(bodegaTable.sucursal_id, sucursalId));
    logger.info(`Se encontraron ${bodega.length} bodegas para la sucursal ${sucursalId}`);
    return bodega;
  },

  async create(data: InsertBodega): Promise<SelectBodega> {
    const [result] = await db.insert(bodegaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Bodega creada exitosamente");
      return result;
    }
    logger.error("Error al crear la bodega");
    throw new Error("Error al crear la bodega");
  },

  async update(id: number, data: UpdateBodega): Promise<SelectBodega | null> {
    const [result] = await db.update(bodegaTable).set(data).where(eq(bodegaTable.id, id)).returning();
    if (result) {
      logger.info(`Bodega con id ${id} actualizada exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar la bodega con id ${id}`);
    throw new Error("Error al actualizar la bodega");
  }
}