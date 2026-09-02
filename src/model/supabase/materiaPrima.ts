import { db } from "./db.js"
import { materiaPrimaTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IMateriaPrimaModel } from "../../types.js";
import type { InsertMateriaPrima, SelectMateriaPrima, UpdateMateriaPrima } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const MateriaPrimaModel: IMateriaPrimaModel = {
    async getAll(): Promise<SelectMateriaPrima[]> {
        const materiasPrimas = await db.select().from(materiaPrimaTable).limit(100).offset(0);
        if (materiasPrimas.length === 0) {
            logger.warn("No se encontraron materias primas");
            throw new Error("No se encontraron materias primas");
        }
        logger.info(`Se encontraron ${materiasPrimas.length} materias primas`);
        return materiasPrimas;
    },
    async getById(id: number): Promise<SelectMateriaPrima | null> {
        const materiaPrima = await db.select().from(materiaPrimaTable).where(eq(materiaPrimaTable.id, id));
        if (!materiaPrima[0]) {
            logger.warn(`Materia prima con id ${id} no encontrada`);
            throw new Error("Materia prima no encontrada");
        }
        logger.info(`Se encontró la materia prima con id ${id}`);
        return materiaPrima[0] || null;
    },
    async create(data: InsertMateriaPrima): Promise<SelectMateriaPrima> {
        const [result] = await db.insert(materiaPrimaTable).values({ ...data }).returning();
        if (result) {
            logger.info("Materia prima creada exitosamente");
            return result;
        }
        logger.error("Error al crear la materia prima");
        throw new Error("Error al crear la materia prima");
    },
    async update(id: number, data: UpdateMateriaPrima): Promise<SelectMateriaPrima | null> {
        const [result] = await db.update(materiaPrimaTable).set(data).where(eq(materiaPrimaTable.id, id)).returning();
        if (result) {
            logger.info(`Materia prima con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.warn(`Materia prima con id ${id} no encontrada`);
        throw new Error("Materia prima no encontrada");
    }
}
