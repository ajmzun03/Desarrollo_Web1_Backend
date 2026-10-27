import { db, type Tx } from "./db.model.js"
import { stockBodegaTable } from "../../schemas/db.schema.js";
import { and, eq, asc } from "drizzle-orm";
import type { IStockBodegaModel } from "../../types.js";
import type { InsertStockBodega, SelectStockBodega } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const StockBodegaModel: IStockBodegaModel = {
  async getAll(): Promise<SelectStockBodega[]> {
    const stocks = await db.select().from(stockBodegaTable).orderBy(asc(stockBodegaTable.id)).limit(100).offset(0);
    logger.info(`Se encontraron ${stocks.length} registros de stock bodega`);
    return stocks;
  },

  async getByBodegaId(bodegaId: number): Promise<SelectStockBodega[]> {
    const stocks = await db.select().from(stockBodegaTable).where(eq(stockBodegaTable.bodega_id, bodegaId));
    logger.info(`Se encontraron ${stocks.length} stocks para la bodega ${bodegaId}`);
    return stocks;
  },

  async getByBodegaAndLote(bodegaId: number, loteId: number, executor: Tx = db): Promise<SelectStockBodega | null> {
    const stock = await executor.select().from(stockBodegaTable)
      .where(and(eq(stockBodegaTable.bodega_id, bodegaId), eq(stockBodegaTable.lote_id, loteId)))
      .limit(1);
    return stock[0] || null;
  },

  async create(data: InsertStockBodega, executor: Tx = db): Promise<SelectStockBodega> {
    const [result] = await executor.insert(stockBodegaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Stock bodega creado exitosamente");
      return result;
    }
    logger.error("Error al crear el stock bodega");
    throw new Error("Error al crear el stock bodega");
  }
}