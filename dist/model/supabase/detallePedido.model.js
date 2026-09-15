import { db } from "./db.model.js";
import { detallePedidoTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const DetallePedidoModel = {
    async getByPedidoId(pedidoId) {
        const detalles = await db.select().from(detallePedidoTable).where(eq(detallePedidoTable.pedido_id, pedidoId));
        logger.info(`Se encontraron ${detalles.length} detalles para el pedido ${pedidoId}`);
        return detalles;
    },
    async create(data) {
        const [result] = await db.insert(detallePedidoTable).values({ ...data }).returning();
        if (result) {
            logger.info("Detalle de pedido creado exitosamente");
            return result;
        }
        logger.error("Error al crear el detalle de pedido");
        throw new Error("Error al crear el detalle de pedido");
    }
};
//# sourceMappingURL=detallePedido.model.js.map