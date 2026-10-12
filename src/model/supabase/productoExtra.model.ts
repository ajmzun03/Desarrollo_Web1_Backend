import { db } from "./db.model.js";
import { productoExtraTable, detalleProductoExtraTable } from "../../schemas/db.schema.js";
import { eq, and } from "drizzle-orm";
import type {
  SelectProductoExtra,
  InsertProductoExtra,
  UpdateProductoExtra,
  SelectDetalleProductoExtra,
  InsertDetalleProductoExtra
} from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const ProductoExtraModel = {
  async getAll(): Promise<SelectProductoExtra[]> {
    const extras = await db.select().from(productoExtraTable).where(eq(productoExtraTable.activo, true));
    logger.info(`Se encontraron ${extras.length} productos extra activos`);
    return extras;
  },

  async getById(id: number): Promise<SelectProductoExtra | null> {
    const [extra] = await db.select().from(productoExtraTable).where(eq(productoExtraTable.id, id)).limit(1);
    return extra || null;
  },

  async getByProductoId(productoId: number): Promise<SelectProductoExtra[]> {
    return await db
      .select()
      .from(productoExtraTable)
      .where(and(eq(productoExtraTable.producto_id, productoId), eq(productoExtraTable.activo, true)));
  },

  async create(data: InsertProductoExtra): Promise<SelectProductoExtra> {
    const [extra] = await db.insert(productoExtraTable).values(data).returning();
    if (!extra) throw new Error("Error al crear producto extra");
    return extra;
  },

  async update(id: number, data: UpdateProductoExtra): Promise<SelectProductoExtra | null> {
    const [extra] = await db.update(productoExtraTable).set(data).where(eq(productoExtraTable.id, id)).returning();
    return extra || null;
  },

  async delete(id: number): Promise<SelectProductoExtra | null> {
    const [extra] = await db.update(productoExtraTable).set({ activo: false }).where(eq(productoExtraTable.id, id)).returning();
    return extra || null;
  },

  async createDetalle(data: InsertDetalleProductoExtra): Promise<SelectDetalleProductoExtra> {
    const [detalle] = await db.insert(detalleProductoExtraTable).values(data).returning();
    if (!detalle) throw new Error("Error al asociar extra al detalle del pedido");
    return detalle;
  },

  async getDetallesByDetallePedidoId(detallePedidoId: number): Promise<SelectDetalleProductoExtra[]> {
    return await db
      .select()
      .from(detalleProductoExtraTable)
      .where(eq(detalleProductoExtraTable.detalle_pedido_id, detallePedidoId));
  }
};
