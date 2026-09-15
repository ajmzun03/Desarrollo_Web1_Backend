import { db } from "./db.model.js"
import { recetaTable, recetaDetalleTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IRecetaModel, IRecetaDetalleModel } from "../../types.js";
import type { InsertReceta, SelectReceta, UpdateReceta, InsertRecetaDetalle, SelectRecetaDetalle } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const RecetaModel: IRecetaModel = {
  async getAll(): Promise<SelectReceta[]> {
    const recetas = await db.select().from(recetaTable).limit(100).offset(0);
    if (recetas.length === 0) {
      logger.warn("No se encontraron recetas");
      throw new Error("No se encontraron recetas");
    }
    logger.info(`Se encontraron ${recetas.length} recetas`);
    return recetas;
  },

  async getById(id: number): Promise<SelectReceta | null> {
    const receta = await db.select().from(recetaTable).where(eq(recetaTable.id, id)).limit(1);
    if (receta.length === 0) {
      logger.warn(`Receta con ID ${id} no encontrada`);
      throw new Error("Receta no encontrada");
    }
    logger.info(`Receta con ID ${id} encontrada`);
    return receta[0] || null;
  },

  async create(data: InsertReceta): Promise<SelectReceta> {
    const [result] = await db.insert(recetaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Receta creada exitosamente");
      return result;
    }
    logger.error("Error al crear la receta");
    throw new Error("Error al crear la receta");
  },

  async update(id: number, data: UpdateReceta): Promise<SelectReceta | null> {
    const [result] = await db.update(recetaTable).set(data).where(eq(recetaTable.id, id)).returning();
    if (result) {
      logger.info(`Receta con id ${id} actualizada exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar la receta con id ${id}`);
    throw new Error("Error al actualizar la receta");
  }
}

export const RecetaDetalleModel: IRecetaDetalleModel = {
  async getByRecetaId(recetaId: number): Promise<SelectRecetaDetalle[]> {
    const detalles = await db.select().from(recetaDetalleTable).where(eq(recetaDetalleTable.receta_id, recetaId));
    logger.info(`Se encontraron ${detalles.length} detalles para la receta ${recetaId}`);
    return detalles;
  },

  async create(data: InsertRecetaDetalle): Promise<SelectRecetaDetalle> {
    const [result] = await db.insert(recetaDetalleTable).values({ ...data }).returning();
    if (result) {
      logger.info("Detalle de receta creado exitosamente");
      return result;
    }
    logger.error("Error al crear el detalle de receta");
    throw new Error("Error al crear el detalle de receta");
  }
}