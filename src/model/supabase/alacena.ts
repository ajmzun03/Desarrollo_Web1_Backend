import { db } from "./db.js"
import { alacenaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IAlacenaModel } from "../../types.js";
import type { SelectAlacena, InsertAlacena, UpdateAlacena } from "../../schemas/db.js"
import logger from "../../config/logger.js"

export const AlacenaModel: IAlacenaModel = {
    async getAll(): Promise<SelectAlacena[]> {
        const alacenas = await db.select().from(alacenaTable).limit(100).offset(0)
        if (alacenas.length === 0 ){
            logger.warn("No se ecnotaron alacenas")
            throw new Error("No se encontraron alacenas")
        }
        logger.info('Se encontraron ${alacenas.length} alacenas')
        return alacenas;
    },
    async getById(id: number): Promise<SelectAlacena | null> {
        const alacena = await db.select().from(alacenaTable).where(eq(alacenaTable.id, id))
        if (!alacena[0]){
            logger.warn("Alacena con id ${id} no encontrado ")
            throw new Error("Alacena no encontrada")
        }
        return alacena[0] || null;
    },
    async create(data: InsertAlacena): Promise<SelectAlacena> {
        const [result] = await db.insert(alacenaTable).values({...data}).returning()
        if (result){
            logger.info("Alacena creada exitosamente")
            return result;
        }
        logger.error("Error al crear la alacena")
        throw new Error("Error al crear la alacena");
    },
    async update(id: number, data: UpdateAlacena): Promise<SelectAlacena | null> {
        const [result] = await db.update(alacenaTable).set(data).where(eq(alacenaTable.id, id)).returning();
        if (result){
            logger.info(`Alacena con id ${id} actualizada exitosamente`)
            return result;
        }
        logger.error(`Error al actualizar la alacena con id ${id}`)
        throw new Error("Error al actualizar la alacena");
    }
}