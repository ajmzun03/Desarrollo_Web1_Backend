import { db } from "./db.model.js";
import { clienteTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const ClienteModel = {
    async getAll() {
        const clientes = await db.select().from(clienteTable).limit(100).offset(0);
        if (clientes.length === 0) {
            logger.warn("No se encontraron clientes");
            throw new Error("No se encontraron clientes");
        }
        logger.info(`Se encontraron ${clientes.length} clientes`);
        return clientes;
    },
    async getById(id) {
        const cliente = await db.select().from(clienteTable).where(eq(clienteTable.id, id)).limit(1).offset(0);
        if (cliente.length === 0) {
            logger.warn(`Cliente con ID ${id} no encontrado`);
            throw new Error("No se encontró el cliente");
        }
        logger.info(`Se encontró el cliente con ID ${id}`);
        return cliente[0] || null;
    },
    async create(data) {
        const [result] = await db.insert(clienteTable).values({ ...data }).returning();
        if (result) {
            logger.info("Cliente creado exitosamente");
            return result;
        }
        logger.error("Error al crear el cliente");
        throw new Error("Error al crear el cliente");
    },
    async update(id, data) {
        const [result] = await db.update(clienteTable).set(data).where(eq(clienteTable.id, id)).returning();
        if (result) {
            logger.info(`Cliente con id ${id} actualizado exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar el cliente con id ${id}`);
        throw new Error("Error al actualizar el cliente");
    }
};
//# sourceMappingURL=cliente.model.js.map