import type { IPedidoModel } from "../../types.js";
import { type SelectPedido, type InsertPedido, type UpdatePedido, pedidoTable } from "../../schemas/db.schema.js";
import { db, type Tx } from "./db.model.js";
import { eq, desc, and, asc } from "drizzle-orm";
import logger from "../../config/logger.js";

export const PedidoModel: IPedidoModel = {
  async getAll(): Promise<SelectPedido[]> {
    const pedidos = await db.select().from(pedidoTable).orderBy(asc(pedidoTable.id)).limit(100).offset(0);
    logger.info(`Se encontraron ${pedidos.length} pedidos`);
    return pedidos;
  },

  async getPaginado({ limit, offset, estado }: { limit: number; offset: number; estado?: string | undefined }): Promise<SelectPedido[]> {
    const where = estado ? eq(pedidoTable.estado, estado as any) : undefined
    return db.select().from(pedidoTable).where(where).orderBy(desc(pedidoTable.id)).limit(limit).offset(offset)
  },

  async getByClienteId(id: number): Promise<SelectPedido[]> {
    return db.select().from(pedidoTable).where(eq(pedidoTable.cliente_id, id)).orderBy(desc(pedidoTable.id))
  },

  async marcarPagado(id: number, stripePaymentId: string): Promise<SelectPedido | null> {
    const [result] = await db.update(pedidoTable)
      .set({ pagado: true, stripe_payment_id: stripePaymentId })
      .where(and(eq(pedidoTable.id, id), eq(pedidoTable.pagado, false)))
      .returning()
    return result ?? null
  },

  async getByEstado(estado: string): Promise<SelectPedido[]> {
    const pedidos = await db.select().from(pedidoTable).where(eq(pedidoTable.estado, estado as any));
    logger.info(`Se encontraron ${pedidos.length} pedidos con estado ${estado}`);
    return pedidos;
  },

  async getPedidoId(id: number): Promise<SelectPedido | null> {
    const pedido = await db.select().from(pedidoTable).where(eq(pedidoTable.id, id))
    if (!pedido || pedido.length === 0) {
      logger.warn(`No se encontró el pedido con id ${id}`)
      return null
    }
    return pedido[0] || null
  },

  async createPedido(data: InsertPedido, executor: Tx = db): Promise<SelectPedido> {
    const [result] = await executor.insert(pedidoTable).values({ ...data }).returning()
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
    logger.warn(`Pedido con id ${id} no encontrado al actualizar`)
    return null
  }
}