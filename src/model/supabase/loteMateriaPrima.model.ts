import { db } from "./db.model.js"
import { loteMateriaPrimaTable } from "../../schemas/db.schema.js";
import { eq, asc, and } from "drizzle-orm";
import type { ILoteMateriaPrimaModel } from "../../types.js";
import type { InsertLoteMateriaPrima, SelectLoteMateriaPrima, UpdateLoteMateriaPrima } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const LoteMateriaPrimaModel: ILoteMateriaPrimaModel = {
  async getAll(): Promise<SelectLoteMateriaPrima[]> {
    const lotes = await db.select().from(loteMateriaPrimaTable).limit(100).offset(0);
    if (lotes.length === 0) {
      logger.warn("No se encontraron lotes de materia prima");
      throw new Error("No se encontraron lotes de materia prima");
    }
    logger.info(`Se encontraron ${lotes.length} lotes de materia prima`);
    return lotes;
  },

  async getById(id: number): Promise<SelectLoteMateriaPrima | null> {
    const lote = await db.select().from(loteMateriaPrimaTable).where(eq(loteMateriaPrimaTable.id, id)).limit(1);
    if (lote.length === 0) {
      logger.warn(`Lote de materia prima con ID ${id} no encontrado`);
      throw new Error("Lote de materia prima no encontrado");
    }
    logger.info(`Lote de materia prima con ID ${id} encontrado`);
    return lote[0] || null;
  },

  async getByMateriaPrimaId(materiaPrimaId: number): Promise<SelectLoteMateriaPrima[]> {
    const lotes = await db.select().from(loteMateriaPrimaTable).where(eq(loteMateriaPrimaTable.materia_prima_id, materiaPrimaId));
    logger.info(`Se encontraron ${lotes.length} lotes para la materia prima ${materiaPrimaId}`);
    return lotes;
  },

  async getByBodegaId(bodegaId: number): Promise<SelectLoteMateriaPrima[]> {
    // Esta consulta requiere join con stock_bodega - por ahora retornamos todos
    const lotes = await db.select().from(loteMateriaPrimaTable).where(eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any));
    logger.info(`Se encontraron ${lotes.length} lotes vigentes`);
    return lotes;
  },

  async getFEFO(bodegaId: number, materiaPrimaId: number): Promise<SelectLoteMateriaPrima[]> {
    // FEFO: First Expired First Out - ordenado por fecha de vencimiento
    const lotes = await db.select().from(loteMateriaPrimaTable)
      .where(and(
        eq(loteMateriaPrimaTable.materia_prima_id, materiaPrimaId),
        eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any)
      ))
      .orderBy(asc(loteMateriaPrimaTable.fecha_vencimiento))
      .limit(50);
    logger.info(`Se encontraron ${lotes.length} lotes FEFO para materia prima ${materiaPrimaId}`);
    return lotes;
  },

  async create(data: InsertLoteMateriaPrima): Promise<SelectLoteMateriaPrima> {
    const [result] = await db.insert(loteMateriaPrimaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Lote de materia prima creado exitosamente");
      return result;
    }
    logger.error("Error al crear el lote de materia prima");
    throw new Error("Error al crear el lote de materia prima");
  },

  async update(id: number, data: UpdateLoteMateriaPrima): Promise<SelectLoteMateriaPrima | null> {
    const [result] = await db.update(loteMateriaPrimaTable).set(data).where(eq(loteMateriaPrimaTable.id, id)).returning();
    if (result) {
      logger.info(`Lote de materia prima con id ${id} actualizado exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar el lote de materia prima con id ${id}`);
    throw new Error("Error al actualizar el lote de materia prima");
  }
}