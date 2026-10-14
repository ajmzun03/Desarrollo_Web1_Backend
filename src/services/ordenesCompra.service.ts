import { db } from '../model/supabase/db.model.js';
import { OrdenCompraModel, DetalleOrdenCompraModel } from '../model/supabase/ordenCompra.model.js';
import type { SelectOrdenCompra, SelectDetalleOrdenCompra } from '../schemas/db.schema.js';

export interface CrearOrdenCompraInput {
  proveedor_id: number;
  sucursal_destino: number;
  items: Array<{ materia_prima_id: number; cantidad_solicitada: number; precio_unitario: number }>;
}

export async function crearOrdenCompra(input: CrearOrdenCompraInput): Promise<SelectOrdenCompra & { detalles: SelectDetalleOrdenCompra[] }> {
  return db.transaction(async (tx) => {
    const nuevaOrden = await OrdenCompraModel.create({
      proveedor_id: input.proveedor_id,
      sucursal_destino: input.sucursal_destino,
      estado_orden: 'CREADA'
    }, tx);

    for (const item of input.items) {
      const subtotal = item.cantidad_solicitada * item.precio_unitario;
      await DetalleOrdenCompraModel.create({
        orden_compra_id: Number(nuevaOrden.id),
        materia_prima_id: item.materia_prima_id,
        cantidad_solicitada: String(item.cantidad_solicitada),
        precio_unitario: String(item.precio_unitario),
        subtotal: String(subtotal)
      }, tx);
    }

    const detalles = await DetalleOrdenCompraModel.getByOrdenCompraId(Number(nuevaOrden.id));
    return { ...nuevaOrden, detalles };
  });
}
