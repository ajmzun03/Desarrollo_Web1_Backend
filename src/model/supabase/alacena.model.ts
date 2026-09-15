import { db } from "./db.model.js"
import { alacenaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IAlacenaModel } from "../../types.js";
import type { InsertAlacena, SelectAlacena, UpdateAlacena } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const AlacenaModel: IAlacenaModel = {
  async getAll(): Promise<SelectAlacena[]> {
    const alacenas = await db.select().from(alacenaTable).limit(100).offset(0);
    if (alacenas.length === 0) {
      logger.warn("No se encontraron alacenas");
      throw new Error("No se encontraron alacenas");
    }
    logger.info(`Se encontraron ${alacenas.length} alacenas`);
    return alacenas;
  },

  async getById(id: number): Promise<SelectAlacena | null> {
    const alacena = await db.select().from(alacenaTable).where(eq(alacenaTable.id, id)).limit(1);
    if (alacena.length === 0) {
      logger.warn(`Alacena con ID ${id} no encontrada`);
      throw new Error("Alacena no encontrada");
    }
    logger.info(`Alacena con ID ${id} encontrada`);
    return alacena[0] || null;
  },

  async getByBodegaId(bodegaId: number): Promise<SelectAlacena[]> {
    const alacenas = await db.select().from(alacenaTable).where(eq(alacenaTable.bodega_id, bodegaId));
    logger.info(`Se encontraron ${alacenas.length} alacenas para la bodega ${bodegaId}`);
    return alacenas;
  },

  async create(data: InsertAlacena): Promise<SelectAlacena> {
    const [result] = await db.insert(alacenaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Alacena creada exitosamente");
      return result;
    }
    logger.error("Error al crear la alacena");
    throw new Error("Error al crear la alacena");
  },

  async update(id: number, data: UpdateAlacena): Promise<SelectAlacena | null> {
    const [result] = await db.update(alacenaTable).set(data).where(eq(alacenaTable.id, id)).returning();
    if (result) {
      logger.info(`Alacena con id ${id} actualizada exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar la alacena con id ${id}`);
    throw new Error("Error al actualizar la alacena");
  }
}