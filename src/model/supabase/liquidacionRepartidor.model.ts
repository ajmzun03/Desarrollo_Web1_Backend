import { db } from "./db.model.js"
import { liquidacionRepartidorTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { ILiquidacionRepartidorModel } from "../../types.js";
import type { InsertLiquidacionRepartidor, SelectLiquidacionRepartidor } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const LiquidacionRepartidorModel: ILiquidacionRepartidorModel = {
  async getAll(): Promise<SelectLiquidacionRepartidor[]> {
    const liquidaciones = await db.select().from(liquidacionRepartidorTable).limit(100).offset(0);
    if (liquidaciones.length === 0) {
      logger.warn("No se encontraron liquidaciones de repartidor");
      throw new Error("No se encontraron liquidaciones de repartidor");
    }
    logger.info(`Se encontraron ${liquidaciones.length} liquidaciones de repartidor`);
    return liquidaciones;
  },

  async getById(id: number): Promise<SelectLiquidacionRepartidor | null> {
    const liquidacion = await db.select().from(liquidacionRepartidorTable).where(eq(liquidacionRepartidorTable.id, id)).limit(1);
    if (liquidacion.length === 0) {
      logger.warn(`Liquidación de repartidor con ID ${id} no encontrada`);
      throw new Error("Liquidación de repartidor no encontrada");
    }
    logger.info(`Liquidación de repartidor con ID ${id} encontrada`);
    return liquidacion[0] || null;
  },

  async getByTurnoId(turnoId: number): Promise<SelectLiquidacionRepartidor[]> {
    const liquidaciones = await db.select().from(liquidacionRepartidorTable).where(eq(liquidacionRepartidorTable.turno_id, turnoId));
    logger.info(`Se encontraron ${liquidaciones.length} liquidaciones para el turno ${turnoId}`);
    return liquidaciones;
  },

  async create(data: InsertLiquidacionRepartidor): Promise<SelectLiquidacionRepartidor> {
    const [result] = await db.insert(liquidacionRepartidorTable).values({ ...data }).returning();
    if (result) {
      logger.info("Liquidación de repartidor creada exitosamente");
      return result;
    }
    logger.error("Error al crear la liquidación de repartidor");
    throw new Error("Error al crear la liquidación de repartidor");
  }
}