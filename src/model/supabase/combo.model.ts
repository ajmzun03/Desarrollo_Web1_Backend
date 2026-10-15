import { db } from "./db.model.js";
import { comboTable, comboDetalleTable, productoTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type {
  SelectCombo,
  InsertCombo,
  UpdateCombo,
  SelectComboDetalle,
  InsertComboDetalle
} from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const ComboModel = {
  async getAll(): Promise<SelectCombo[]> {
    const combos = await db.select().from(comboTable).where(eq(comboTable.activo, true));
    logger.info(`Se encontraron ${combos.length} combos activos`);
    return combos;
  },

  async getById(id: number): Promise<SelectCombo | null> {
    const [combo] = await db.select().from(comboTable).where(eq(comboTable.id, id)).limit(1);
    return combo || null;
  },

  async getDetalles(comboId: number): Promise<Array<SelectComboDetalle & { producto?: string; precio_producto?: string }>> {
    const detalles = await db
      .select({
        id: comboDetalleTable.id,
        combo_id: comboDetalleTable.combo_id,
        producto_id: comboDetalleTable.producto_id,
        cantidad: comboDetalleTable.cantidad,
        producto: productoTable.producto,
        precio_producto: productoTable.precio
      })
      .from(comboDetalleTable)
      .leftJoin(productoTable, eq(productoTable.id, comboDetalleTable.producto_id))
      .where(eq(comboDetalleTable.combo_id, comboId));
    return detalles as any;
  },

  async create(data: InsertCombo): Promise<SelectCombo> {
    const [nuevo] = await db.insert(comboTable).values(data).returning();
    if (!nuevo) throw new Error("Error al crear combo");
    return nuevo;
  },

  async update(id: number, data: UpdateCombo): Promise<SelectCombo | null> {
    const [actualizado] = await db
      .update(comboTable)
      .set(data)
      .where(eq(comboTable.id, id))
      .returning();
    return actualizado || null;
  },

  async delete(id: number): Promise<SelectCombo | null> {
    const [desactivado] = await db
      .update(comboTable)
      .set({ activo: false })
      .where(eq(comboTable.id, id))
      .returning();
    return desactivado || null;
  },

  async createDetalle(data: InsertComboDetalle): Promise<SelectComboDetalle> {
    const [detalle] = await db.insert(comboDetalleTable).values(data).returning();
    if (!detalle) throw new Error("Error al agregar detalle al combo");
    return detalle;
  },

  async deleteDetalles(comboId: number): Promise<void> {
    await db.delete(comboDetalleTable).where(eq(comboDetalleTable.combo_id, comboId));
  }
};
