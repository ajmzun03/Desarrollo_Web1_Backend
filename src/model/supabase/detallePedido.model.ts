import { db } from "./db.model.js"
import { detallePedidoTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IDetallePedidoModel } from "../../types.js";
import type { InsertDetallePedido, SelectDetallePedido } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const DetallePedidoModel: IDetallePedidoModel = {
  async getByPedidoId(pedidoId: number): Promise<SelectDetallePedido[]> {
    const detalles = await db.select().from(detallePedidoTable).where(eq(detallePedidoTable.pedido_id, pedidoId));
    logger.info(`Se encontraron ${detalles.length} detalles para el pedido ${pedidoId}`);
    return detalles;
  },

  async create(data: InsertDetallePedido): Promise<SelectDetallePedido> {
    const [result] = await db.insert(detallePedidoTable).values({ ...data }).returning();
    if (result) {
      logger.info("Detalle de pedido creado exitosamente");
      return result;
    }
    logger.error("Error al crear el detalle de pedido");
    throw new Error("Error al crear el detalle de pedido");
  }
}