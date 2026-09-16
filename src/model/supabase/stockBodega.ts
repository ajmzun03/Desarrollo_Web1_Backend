import { db } from "./db.js"
import { stockBodegaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { SelectStockBodega } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const StockBodegaModel = {
    async getAll(): Promise<SelectStockBodega[]> {
        const stockBodegas = await db.select().from(stockBodegaTable).limit(100).offset(0);
        if (stockBodegas.length === 0) {
            logger.warn("No se encontró stock de bodega")
            throw new Error("No se encontraron stock de bodega")
        }
        logger.info('Se encontraron ${stockBodegas.length} stock de bodega')
        return stockBodegas;
    },
    async getById(id: number): Promise<SelectStockBodega | null>{
        const stockBodega = await db.select().from(stockBodegaTable).where(eq(stockBodegaTable.id, id));
        if (!stockBodega[0]){
            logger.warn('Stock de Bodega con id ${id} no encontrado')
            throw new Error('Stock de Bodega no encontrado');
        }
        logger.info('Se encontró el stock de bodega con id ${id}');
        return stockBodega[0] || null;
    }
}
