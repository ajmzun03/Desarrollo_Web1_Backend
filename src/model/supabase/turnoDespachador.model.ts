import { db } from "./db.model.js"
import { turnoDespachadorTable } from "../../schemas/db.schema.js";
import { eq, isNull } from "drizzle-orm";
import type { ITurnoDespachadorModel } from "../../types.js";
import type { InsertTurnoDespachador, SelectTurnoDespachador, UpdateTurnoDespachador } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const TurnoDespachadorModel: ITurnoDespachadorModel = {
  async getAll(): Promise<SelectTurnoDespachador[]> {
    const turnos = await db.select().from(turnoDespachadorTable).limit(100).offset(0);
    if (turnos.length === 0) {
      logger.warn("No se encontraron turnos de despachador");
      throw new Error("No se encontraron turnos de despachador");
    }
    logger.info(`Se encontraron ${turnos.length} turnos de despachador`);
    return turnos;
  },

  async getById(id: number): Promise<SelectTurnoDespachador | null> {
    const turno = await db.select().from(turnoDespachadorTable).where(eq(turnoDespachadorTable.id, id)).limit(1);
    if (turno.length === 0) {
      logger.warn(`Turno de despachador con ID ${id} no encontrado`);
      throw new Error("Turno de despachador no encontrado");
    }
    logger.info(`Turno de despachador con ID ${id} encontrado`);
    return turno[0] || null;
  },

  async getAbiertos(): Promise<SelectTurnoDespachador[]> {
    const turnos = await db.select().from(turnoDespachadorTable).where(isNull(turnoDespachadorTable.cerrado_en));
    logger.info(`Se encontraron ${turnos.length} turnos abiertos`);
    return turnos;
  },

  async create(data: InsertTurnoDespachador): Promise<SelectTurnoDespachador> {
    const [result] = await db.insert(turnoDespachadorTable).values({ ...data }).returning();
    if (result) {
      logger.info("Turno de despachador creado exitosamente");
      return result;
    }
    logger.error("Error al crear el turno de despachador");
    throw new Error("Error al crear el turno de despachador");
  },

  async update(id: number, data: UpdateTurnoDespachador): Promise<SelectTurnoDespachador | null> {
    const [result] = await db.update(turnoDespachadorTable).set(data).where(eq(turnoDespachadorTable.id, id)).returning();
    if (result) {
      logger.info(`Turno de despachador con id ${id} actualizado exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar el turno de despachador con id ${id}`);
    throw new Error("Error al actualizar el turno de despachador");
  }
}