import { db } from "./db.model.js"
import { ordenTrabajoTable } from "../../schemas/db.schema.js";
import { eq, and } from "drizzle-orm";
import type { IOrdenTrabajoModel } from "../../types.js";
import type { InsertOrdenTrabajo, SelectOrdenTrabajo, UpdateOrdenTrabajo } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const OrdenTrabajoModel: IOrdenTrabajoModel = {
  async getAll(): Promise<SelectOrdenTrabajo[]> {
    const ordenes = await db.select().from(ordenTrabajoTable).limit(100).offset(0);
    if (ordenes.length === 0) {
      logger.warn("No se encontraron órdenes de trabajo");
      throw new Error("No se encontraron órdenes de trabajo");
    }
    logger.info(`Se encontraron ${ordenes.length} órdenes de trabajo`);
    return ordenes;
  },

  async getById(id: number): Promise<SelectOrdenTrabajo | null> {
    const orden = await db.select().from(ordenTrabajoTable).where(eq(ordenTrabajoTable.id, id)).limit(1);
    if (orden.length === 0) {
      logger.warn(`Orden de trabajo con ID ${id} no encontrada`);
      throw new Error("Orden de trabajo no encontrada");
    }
    logger.info(`Orden de trabajo con ID ${id} encontrada`);
    return orden[0] || null;
  },

  async getBySucursalId(sucursalId: number): Promise<SelectOrdenTrabajo[]> {
    const ordenes = await db.select().from(ordenTrabajoTable).where(eq(ordenTrabajoTable.sucursal_id, sucursalId));
    logger.info(`Se encontraron ${ordenes.length} órdenes de trabajo para la sucursal ${sucursalId}`);
    return ordenes;
  },

  async getByEstado(estado: string): Promise<SelectOrdenTrabajo[]> {
    const ordenes = await db.select().from(ordenTrabajoTable).where(eq(ordenTrabajoTable.estado, estado as any));
    logger.info(`Se encontraron ${ordenes.length} órdenes de trabajo con estado ${estado}`);
    return ordenes;
  },

  async create(data: InsertOrdenTrabajo): Promise<SelectOrdenTrabajo> {
    const [result] = await db.insert(ordenTrabajoTable).values({ ...data }).returning();
    if (result) {
      logger.info("Orden de trabajo creada exitosamente");
      return result;
    }
    logger.error("Error al crear la orden de trabajo");
    throw new Error("Error al crear la orden de trabajo");
  },

  async update(id: number, data: UpdateOrdenTrabajo): Promise<SelectOrdenTrabajo | null> {
    const [result] = await db.update(ordenTrabajoTable).set(data).where(eq(ordenTrabajoTable.id, id)).returning();
    if (result) {
      logger.info(`Orden de trabajo con id ${id} actualizada exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar la orden de trabajo con id ${id}`);
    throw new Error("Error al actualizar la orden de trabajo");
  }
}