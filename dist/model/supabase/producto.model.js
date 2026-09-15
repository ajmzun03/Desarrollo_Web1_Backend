import { db } from "./db.model.js";
import { productoTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const ProductoModel = {
    async getAll() {
        const productos = await db.select().from(productoTable).limit(100).offset(0);
        if (productos.length === 0) {
            logger.warn("No se encontraron productos");
            throw new Error("No se encontraron productos");
        }
        logger.info(`Se encontraron ${productos.length} productos`);
        return productos;
    },
    async getById(id) {
        const producto = await db.select().from(productoTable).where(eq(productoTable.id, id)).limit(1);
        if (producto.length === 0) {
            logger.warn(`Producto con ID ${id} no encontrado`);
            throw new Error("Producto no encontrado");
        }
        logger.info(`Producto con ID ${id} encontrado`);
        return producto[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(productoTable).values({ ...data }).returning();
        if (result) {
            logger.info("Producto creado exitosamente");
            return result;
        }
        logger.error("Error al crear el producto");
        throw new Error("Error al crear el producto");
    },
    async update(id, data) {
        const [result] = await db.update(productoTable).set(data).where(eq(productoTable.id, id)).returning();
        if (result) {
            logger.info(`Producto con id ${id} actualizado exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar el producto con id ${id}`);
        throw new Error("Error al actualizar el producto");
    }
};
//# sourceMappingURL=producto.model.js.map