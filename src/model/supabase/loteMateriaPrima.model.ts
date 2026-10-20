import { db, type Tx } from "./db.model.js"
import { loteMateriaPrimaTable, stockBodegaTable, stockAlacenaTable, bodegaTable } from "../../schemas/db.schema.js";
import { eq, asc, and, or, lte, sql } from "drizzle-orm";
import type { ILoteMateriaPrimaModel } from "../../types.js";
import type { InsertLoteMateriaPrima, SelectLoteMateriaPrima, UpdateLoteMateriaPrima } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const LoteMateriaPrimaModel: ILoteMateriaPrimaModel = {
  async getAll(): Promise<SelectLoteMateriaPrima[]> {
    const lotes = await db.select().from(loteMateriaPrimaTable).limit(100).offset(0);
    logger.info(`Se encontraron ${lotes.length} lotes de materia prima`);
    return lotes;
  },

  /** Con `bloquear` toma SELECT ... FOR UPDATE: debe usarse dentro de una transacción. */
  async getById(id: number, executor: Tx = db, bloquear = false): Promise<SelectLoteMateriaPrima | null> {
    const consulta = executor.select().from(loteMateriaPrimaTable).where(eq(loteMateriaPrimaTable.id, id)).limit(1);
    const lote = await (bloquear ? consulta.for('update') : consulta);
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
    const lotes = await db
      .select({
        id: loteMateriaPrimaTable.id,
        materia_prima_id: loteMateriaPrimaTable.materia_prima_id,
        fecha_vencimiento: loteMateriaPrimaTable.fecha_vencimiento,
        cantidad_inicial: loteMateriaPrimaTable.cantidad_inicial,
        cantidad_actual: loteMateriaPrimaTable.cantidad_actual,
        estado: loteMateriaPrimaTable.estado,
        creado_en: loteMateriaPrimaTable.creado_en
      })
      .from(loteMateriaPrimaTable)
      .innerJoin(stockBodegaTable, eq(stockBodegaTable.lote_id, loteMateriaPrimaTable.id))
      .where(and(
        eq(stockBodegaTable.bodega_id, bodegaId),
        eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any)
      ));
    logger.info(`Se encontraron ${lotes.length} lotes vigentes para la bodega ${bodegaId}`);
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

  async create(data: InsertLoteMateriaPrima, executor: Tx = db): Promise<SelectLoteMateriaPrima> {
    const [result] = await executor.insert(loteMateriaPrimaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Lote de materia prima creado exitosamente");
      return result;
    }
    logger.error("Error al crear el lote de materia prima");
    throw new Error("Error al crear el lote de materia prima");
  },

  async update(id: number, data: UpdateLoteMateriaPrima, executor: Tx = db): Promise<SelectLoteMateriaPrima | null> {
    const [result] = await executor.update(loteMateriaPrimaTable).set(data).where(eq(loteMateriaPrimaTable.id, id)).returning();
    if (result) {
      logger.info(`Lote de materia prima con id ${id} actualizado exitosamente`);
      return result;
    }
    logger.error(`Error al actualizar el lote de materia prima con id ${id}`);
    throw new Error("Error al actualizar el lote de materia prima");
  },

  async getCriticosPorSucursal(sucursalId: number, dias: number, umbral: number): Promise<SelectLoteMateriaPrima[]> {
    const limite = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    const rows = await db.select({ lote: loteMateriaPrimaTable })
      .from(loteMateriaPrimaTable)
      .innerJoin(stockBodegaTable, eq(stockBodegaTable.lote_id, loteMateriaPrimaTable.id))
      .innerJoin(bodegaTable, eq(bodegaTable.id, stockBodegaTable.bodega_id))
      .where(and(
        eq(bodegaTable.sucursal_id, sucursalId),
        eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any),
        or(
          lte(loteMateriaPrimaTable.fecha_vencimiento, limite),
          lte(loteMateriaPrimaTable.cantidad_actual, String(umbral))
        )
      ));
    const lotes = rows.map(r => r.lote);
    logger.info(`Se encontraron ${lotes.length} lotes críticos para la sucursal ${sucursalId}`);
    return lotes;
  },

  async getBajoMinimoPorSucursal(sucursalId: number, umbral: number): Promise<SelectLoteMateriaPrima[]> {
    const rows = await db.select({ lote: loteMateriaPrimaTable })
      .from(loteMateriaPrimaTable)
      .innerJoin(stockBodegaTable, eq(stockBodegaTable.lote_id, loteMateriaPrimaTable.id))
      .innerJoin(bodegaTable, eq(bodegaTable.id, stockBodegaTable.bodega_id))
      .where(and(
        eq(bodegaTable.sucursal_id, sucursalId),
        eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any),
        lte(loteMateriaPrimaTable.cantidad_actual, String(umbral))
      ));
    const lotes = rows.map(r => r.lote);
    logger.info(`Se encontraron ${lotes.length} lotes bajo mínimo para la sucursal ${sucursalId}`);
    return lotes;
  },

  async getVencimientosPorAlacena(alacenaId: number, dias: number): Promise<SelectLoteMateriaPrima[]> {
    const limite = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    const rows = await db.select({ lote: loteMateriaPrimaTable })
      .from(stockAlacenaTable)
      .innerJoin(loteMateriaPrimaTable, eq(loteMateriaPrimaTable.id, stockAlacenaTable.lote_id))
      .where(and(
        eq(stockAlacenaTable.alacena_id, alacenaId),
        eq(loteMateriaPrimaTable.estado, 'VIGENTE' as any),
        lte(loteMateriaPrimaTable.fecha_vencimiento, limite)
      ))
      .orderBy(asc(loteMateriaPrimaTable.fecha_vencimiento));
    const lotes = rows.map(r => r.lote);
    logger.info(`Se encontraron ${lotes.length} lotes por vencer en la alacena ${alacenaId}`);
    return lotes;
  }
}