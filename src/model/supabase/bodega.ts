import { db } from "./db.js"
import { bodegaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IBodegaModel } from "../../types.js";
import type { SelectBodega, InsertBodega, UpdateBodega } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const BodegaModel: IBodegaModel = {
    async getAll(): Promise<SelectBodega[]>{
        const bodegas = await db.select().from(bodegaTable).limit(100).offset(0);
        if (bodegas.length === 0) {
           logger.warn("No se encontraron bodegas");
           throw new Error("No se encontraron bodegas");
        }
        logger.info ('Se econtraron ${bodegas.length} bodegas');
        return bodegas;
    },
    async getById(id: number): Promise<SelectBodega | null> {
        const bodega = await db.select().from(bodegaTable).where(eq(bodegaTable.id,id));
        if (!bodega[0]){
            logger.warn('Bodega con id ${id} no encontrada');
            throw new Error('Bodega no encontrada');
        }
        logger.info('Se encontró la bodega con id ${id}');
        return bodega[0] || null;
    },
    async create(data: InsertBodega): Promise<SelectBodega> {
        const [result] = await db.insert(bodegaTable).values({...data}).returning();
        if (result){
            logger.info('Bodega creada exitosamente');
            return result;
        }
        logger.error('Error al crear la bodega');
        throw new Error('Erro al crear la bodega');
    },
    async update(id: number, data:UpdateBodega): Promise<SelectBodega | null>{
        const [result]= await db.update(bodegaTable).set(data).where(eq(bodegaTable.id,id)).returning();
        if (result){
            logger.info('Bodega actualizada exitosamente');
            return result;
        }
        logger.error('Error al actualizar la bodega con id ${id}');
        throw new Error('Error al actualizar la bodega con id ${id}');
    }

}