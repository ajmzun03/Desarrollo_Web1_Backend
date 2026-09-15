import { db } from "./db.model.js"
import { stockBodegaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IStockBodegaModel } from "../../types.js";
import type { InsertStockBodega, SelectStockBodega } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const StockBodegaModel: IStockBodegaModel = {
  async getAll(): Promise<SelectStockBodega[]> {
    const stocks = await db.select().from(stockBodegaTable).limit(100).offset(0);
    logger.info(`Se encontraron ${stocks.length} registros de stock bodega`);
    return stocks;
  },

  async getByBodegaId(bodegaId: number): Promise<SelectStockBodega[]> {
    const stocks = await db.select().from(stockBodegaTable).where(eq(stockBodegaTable.bodega_id, bodegaId));
    logger.info(`Se encontraron ${stocks.length} stocks para la bodega ${bodegaId}`);
    return stocks;
  },

  async create(data: InsertStockBodega): Promise<SelectStockBodega> {
    const [result] = await db.insert(stockBodegaTable).values({ ...data }).returning();
    if (result) {
      logger.info("Stock bodega creado exitosamente");
      return result;
    }
    logger.error("Error al crear el stock bodega");
    throw new Error("Error al crear el stock bodega");
  }
}