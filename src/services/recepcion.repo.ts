import { eq } from 'drizzle-orm';
import type { Tx } from '../model/supabase/db.model.js';
import { bodegaTable, ordenCompraTable, detalleOrdenCompraTable } from '../schemas/db.schema.js';
import type { SelectBodega, SelectOrdenCompra, SelectDetalleOrdenCompra } from '../schemas/db.schema.js';

/** Accesos a BD de la recepción, separados para poder simularlos en los tests del servicio. */
export async function cargarBodega(tx: Tx, id: number): Promise<SelectBodega | null> {
  const [bodega] = await tx.select().from(bodegaTable).where(eq(bodegaTable.id, id)).limit(1);
  return bodega ?? null;
}

/** Carga la orden de compra bloqueándola (FOR UPDATE) junto con sus detalles. */
export async function cargarOrdenConDetalles(
  tx: Tx,
  id: number
): Promise<{ orden: SelectOrdenCompra; detalles: SelectDetalleOrdenCompra[] } | null> {
  const [orden] = await tx.select().from(ordenCompraTable).where(eq(ordenCompraTable.id, id)).limit(1).for('update');
  if (!orden) return null;
  const detalles = await tx.select().from(detalleOrdenCompraTable).where(eq(detalleOrdenCompraTable.orden_compra_id, id));
  return { orden, detalles };
}

export async function finalizarOrden(tx: Tx, id: number): Promise<void> {
  await tx.update(ordenCompraTable).set({ estado_orden: 'FINALIZADO' }).where(eq(ordenCompraTable.id, id));
}
