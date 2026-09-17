import { db } from "./db.js"
import { kardexBodegaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IKardexBodegaModel } from "../../types.js";
import type { SelectKardexBodega } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const KardexBodegaModel: IKardexBodegaModel = {
    async getAll(): Promise<SelectKardexBodega[]> {
        const kardexBodegas = await db.select().from(kardexBodegaTable).limit(100).offset(0);
        if (kardexBodegas.length === 0 ){
            logger.warn("No se encontro el kardex")
            throw new Error("No se encontraron kardex")
        }
        logger.info('Se econtraron ${kardexBodegas.length} kardex')
        return kardexBodegas;
    },
    async getById(id: number): Promise<SelectKardexBodega | null> {
        const kardexBodega = await db.select().from(kardexBodegaTable).where(eq(kardexBodegaTable.id, id));
        if (!kardexBodega[0]){
            logger.warn('kardex de Bodega con id ${id} no encontrado')
            throw new Error('kardex de bodega no encontrado')
        }
        logger.info('Se encontró el kardex de bodega con id ${id}');
        return kardexBodega[0] || null;
    }
}