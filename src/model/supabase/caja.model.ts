import { db } from "./db.model.js"
import { cajaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { ICajaModel } from "../../types.js";
import type { InsertCaja, SelectCaja, UpdateCaja } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const CajaModel: ICajaModel = {
  async getAll(): Promise<SelectCaja[]> {
    const cajas = await db.select().from(cajaTable).limit(100).offset(0);
    if (cajas.length === 0) {
      logger.warn("No se encontraron cajas");
      throw new Error("No se encontraron cajas");
    }
    logger.info(`Se encontraron ${cajas.length} cajas`);
    return cajas;
  },

  async getById(id: number): Promise<SelectCaja | null> {
    const caja = await db.select().from(cajaTable).where(eq(cajaTable.id, id)).limit(1);
    if (caja.length === 0) {
      logger.warn(`Caja con ID ${id} no encontrada`);
      throw new Error("Caja no encontrada");
    }
    logger.info(`Caja con ID ${id} encontrada`);
    return caja[0] || null;
  },

  async getBySucursalId(sucursalId: number): Promise<SelectCaja[]> {
    const cajas = await db.select().from(cajaTable).where(eq(cajaTable.sucursal_id, sucursalId));
    logger.info(`Se encontraron ${cajas.length} cajas para la sucursal ${sucursalId}`);
    return cajas;
  },

  async create(data: InsertCaja): Promise<SelectCaja> {
    const [result] = await db.insert(cajaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Caja creada exitosamente");
      return result;
    }
    logger.error("Error al crear la caja");
    throw new Error("Error al crear la caja");
  },

  async update(id: number, data: UpdateCaja): Promise<SelectCaja | null> {
    const [result] = await db.update(cajaTable).set(data).where(eq(cajaTable.id, id)).returning();
    if (result) {
      logger.info(`Caja con id ${id} actualizada exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar la caja con id ${id}`);
    throw new Error("Error al actualizar la caja");
  }
}