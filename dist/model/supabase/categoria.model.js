import { db } from "./db.model.js";
import { categoriaTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const CategoriaModel = {
    async getAll() {
        const categorias = await db.select().from(categoriaTable).limit(100).offset(0);
        if (categorias.length === 0) {
            logger.warn("No se encontraron categorias");
            throw new Error("No se encontraron categorias");
        }
        logger.info(`Se encontraron ${categorias.length} categorias`);
        return categorias;
    },
    async getById(id) {
        const categoria = await db.select().from(categoriaTable).where(eq(categoriaTable.id, id));
        if (!categoria[0]) {
            logger.warn(`Categoria con id ${id} no encontrada`);
            throw new Error("Categoria no encontrada");
        }
        logger.info(`Se encontró la categoria con id ${id}`);
        return categoria[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(categoriaTable).values({ ...data }).returning();
        if (result) {
            logger.info("Categoria creada exitosamente");
            return result;
        }
        logger.error("Error al crear la categoria");
        throw new Error("Error al crear la categoria");
    },
    async update(id, data) {
        const [result] = await db.update(categoriaTable).set(data).where(eq(categoriaTable.id, id)).returning();
        if (result) {
            logger.info(`Categoria con id ${id} actualizada exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar la categoria con id ${id}`);
        throw new Error("Error al actualizar la categoria");
    }
};
//# sourceMappingURL=categoria.model.js.map