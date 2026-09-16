import {db } from "./db.js"
import { loteMateriaPrimaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { ILoteMateriaPrimaModel } from "../../types.js";
import type { SelectLoteMateriaPrima, UpdateLoteMateriaPrima } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const LoteMateriaPrimaModel: ILoteMateriaPrimaModel = {
    async getAll(): Promise<SelectLoteMateriaPrima[]>{
        const lotes = await db.select().from(loteMateriaPrimaTable).limit(100).offset(0);
        if (lotes.length === 0) {
            logger.warn("No se encontraron lotes");
            throw new Error("No se encontraron materias primass");
        }
        logger.info('Se encontraron ${lotes.length} lotes');
        return lotes;
    },
    async getById(id: number): Promise<SelectLoteMateriaPrima | null> { 
        const lote = await db.select().from(loteMateriaPrimaTable).where(eq(loteMateriaPrimaTable.id, id));
        if (!lote[0]) {
            logger.warn(`Lote con id ${id} no encontrado`);
            throw new Error("Lote no encontrado");
        }
        logger.info(`Lote con id ${id} encontrado`);
        return lote[0] || null;
    },
    async update(id: number, data: UpdateLoteMateriaPrima): Promise<SelectLoteMateriaPrima | null>{
        const [result] = await db.update(loteMateriaPrimaTable).set(data).where(eq(loteMateriaPrimaTable.id, id)).returning();
        if (result) {
            logger.info('Materia prima con id ${id} actualizada exitosamente');
            return result;
        }
        logger.error('Error al actualizar el lote de materia prima con id ${id}');
        throw new Error('Error al actualizar el lote de materia prima')
    }
}