import { db } from "./db.model.js";
import { unidadMedidaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const UnidadMedidaModel = {
    async getAll() {
        const unidadesMedida = await db.select().from(unidadMedidaTable).limit(100).offset(0);
        if (unidadesMedida.length === 0) {
            logger.warn("No se encontraron unidades de medida");
            throw new Error("No se encontraron unidades de medida");
        }
        logger.info(`Se encontraron ${unidadesMedida.length} unidades de medida`);
        return unidadesMedida;
    },
    async getById(id) {
        const unidadMedida = await db.select().from(unidadMedidaTable).where(eq(unidadMedidaTable.id, id));
        if (!unidadMedida[0]) {
            logger.warn(`Unidad de medida con id ${id} no encontrada`);
            throw new Error("Unidad de medida no encontrada");
        }
        logger.info(`Se encontró la unidad de medida con id ${id}`);
        return unidadMedida[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(unidadMedidaTable).values({ ...data }).returning();
        if (result) {
            logger.info("Unidad de medida creada exitosamente");
            return result;
        }
        logger.error("Error al crear la unidad de medida");
        throw new Error("Error al crear la unidad de medida");
    },
    async update(id, data) {
        const [result] = await db.update(unidadMedidaTable).set(data).where(eq(unidadMedidaTable.id, id)).returning();
        if (result) {
            logger.info(`Unidad de medida con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar la unidad de medida con id ${id}`);
        throw new Error("Error al actualizar la unidad de medida");
    }
};
//# sourceMappingURL=unidadMedida.model.js.map