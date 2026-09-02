import { db } from "./db.js"
import { clienteTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
import type { IClienteModel } from "../../types.js";
import type { SelectCliente, InsertCliente, UpdateCliente } from "../../schemas/db.js";
import logger from "../../config/logger.js";

export const ClienteModel: IClienteModel = {
  async getAll(): Promise<SelectCliente[]> {
    const clientes = await db.select().from(clienteTable).limit(100).offset(0);
    if (clientes.length === 0) {
      logger.warn("No se encontraron clientes");
      throw new Error("No se encontraron clientes");
    }
    logger.info(`Se encontraron ${clientes.length} clientes`);
    return clientes;
  },
    async getById(id: number): Promise<SelectCliente | null> {
      const cliente = await db.select().from(clienteTable).where(eq(clienteTable.id, id)).limit(1).offset(0);
      if (cliente.length === 0) {
        logger.warn(`Cliente con ID ${id} no encontrado`);
        throw new Error("No se encontró el cliente");
      }
      logger.info(`Se encontró el cliente con ID ${id}`);
        return cliente[0] || null;
    },
    async create(data: InsertCliente): Promise<SelectCliente> {
        const [result] = await db.insert(clienteTable).values({ ...data }).returning();
        if (result) {
            logger.info("Cliente creado exitosamente");
            return result;
        }
        logger.error("Error al crear el cliente");
        throw new Error("Error al crear el cliente");
    },
    async update(id: number, data: UpdateCliente): Promise<SelectCliente | null> {
        const [result] = await db.update(clienteTable).set(data).where(eq(clienteTable.id, id)).returning();
        if (result) {
            logger.info(`Cliente con id ${id} actualizado exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar el cliente con id ${id}`);
        throw new Error("Error al actualizar el cliente");
    }
}