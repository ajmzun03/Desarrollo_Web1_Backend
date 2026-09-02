import {db} from "./db.js"
import {departamentoTable} from "../../schemas/db.js";
import {eq} from "drizzle-orm";
import type {IDepartamentoModel} from "../../types.js";
import type {InsertDepartamento, SelectDepartamento} from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const DepartamentoModel: IDepartamentoModel = {
    async getAll(): Promise<SelectDepartamento[]> {
        const departamentos = await db.select().from(departamentoTable).limit(100).offset(0);
        if (departamentos.length === 0) {
            logger.warn("No se encontraron departamentos");
            throw new Error("No se encontraron departamentos");
        }
        logger.info(`Se encontraron ${departamentos.length} departamentos`);
        return departamentos;
    },
    async getById(id: number): Promise<SelectDepartamento | null> {
        const departamento = await db.select().from(departamentoTable).where(eq(departamentoTable.id, id));
        if (departamento.length === 0) {
            logger.warn(`Departamento con id ${id} no encontrado`);
            throw new Error("Departamento no encontrado");
        }
        logger.info(`Departamento con id ${id} encontrado`);
        return departamento[0] || null;
    },
    async create(data: InsertDepartamento): Promise<SelectDepartamento> {
        const [result] = await db.insert(departamentoTable).values({ ...data }).returning();
        if (result) {
            logger.info("Departamento creado exitosamente");
            return result;
        }
        logger.error("Error al crear el departamento");
        throw new Error("Error al crear el departamento");
    }
}
