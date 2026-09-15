import { db } from "./db.model.js";
import { departamentoTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const DepartamentoModel = {
    async getAll() {
        const departamentos = await db.select().from(departamentoTable).limit(100).offset(0);
        if (departamentos.length === 0) {
            logger.warn("No se encontraron departamentos");
            throw new Error("No se encontraron departamentos");
        }
        logger.info(`Se encontraron ${departamentos.length} departamentos`);
        return departamentos;
    },
    async getById(id) {
        const departamento = await db.select().from(departamentoTable).where(eq(departamentoTable.id, id));
        if (departamento.length === 0) {
            logger.warn(`Departamento con id ${id} no encontrado`);
            throw new Error("Departamento no encontrado");
        }
        logger.info(`Departamento con id ${id} encontrado`);
        return departamento[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(departamentoTable).values({ ...data }).returning();
        if (result) {
            logger.info("Departamento creado exitosamente");
            return result;
        }
        logger.error("Error al crear el departamento");
        throw new Error("Error al crear el departamento");
    }
};
//# sourceMappingURL=departamento.model.js.map