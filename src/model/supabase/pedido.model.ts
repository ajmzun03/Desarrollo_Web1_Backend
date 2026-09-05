import type { IPedidoModel } from "../../types.js";
import { type SelectPedido, type InsertPedido, type UpdatePedido, pedidoTable } from "../../schemas/db.schema.js";
import { db } from "./db.model.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import { Cache } from "drizzle-orm/cache/core";

export const PedidoModel: IPedidoModel = {
  async getPedidosCliente(id: number): Promise<SelectPedido[] | null> {
    const pedidosCliente = await db.select().from(pedidoTable).where(eq(pedidoTable.cliente_id, id))
    if (pedidosCliente.length === 0) {
      logger.warn(`No se encontraron pedidos para el cliente con id ${id}`)
      throw new Error(`No se encontraron pedidos para el cliente`)
    }
    return pedidosCliente.length > 0 ? pedidosCliente : null
  },

  async getPedidoId(id: number): Promise<SelectPedido | null> {
    const pedido = await db.select().from(pedidoTable).where(eq(pedidoTable.id, id))
    if (!pedido || pedido.length === 0) {
      logger.warn(`No se encontró el pedido con id ${id}`)
      throw new Error(`No se encontró el pedido`)
    }
    return pedido[0] || null
  },

  async createPedido(data: InsertPedido): Promise<SelectPedido> {
    const [result] = await db.insert(pedidoTable).values({ ...data }).returning()
    if (result) {
      logger.info('Pedido creado exitosamente')
      return result
    }
    logger.error('Error al crear el pedido')
    throw new Error('Error al crear el pedido')
  },

  async updatePedido(id: number, data: UpdatePedido): Promise<SelectPedido | null> {
    const [result] = await db.update(pedidoTable).set(data).where(eq(pedidoTable.id, id)).returning()
    if (result) {
      logger.info(`Pedido con id ${id} actualizado exitosamente`)
      return result
    }
    logger.error(`Error al actualizar el pedido con id ${id}`)
    throw new Error('Error al actualizar el pedido')
  }
}