import { db } from '../model/supabase/db.model.js';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
import { ProductoModel } from '../model/supabase/producto.model.js';
import type { SelectPedido, SelectDetallePedido } from '../schemas/db.schema.js';

export interface CrearPedidoInput {
  cliente_id: number;
  observaciones?: string;
  items: Array<{ producto_id: number; cantidad: number }>;
}

export async function crearPedido(input: CrearPedidoInput): Promise<SelectPedido & { detalles: SelectDetallePedido[] }> {
  return db.transaction(async (tx) => {
    const itemsConPrecio: Array<{ producto_id: number; cantidad: number; precio_unitario: number }> = [];
    let total = 0;

    for (const item of input.items) {
      let precio = 0;
      try {
        const producto = await ProductoModel.getById(item.producto_id);
        precio = Number(producto?.precio ?? 0);
      } catch {
        precio = 0;
      }
      itemsConPrecio.push({ ...item, precio_unitario: precio });
      total += precio * item.cantidad;
    }

    const nuevoPedido = await PedidoModel.createPedido({
      cliente_id: input.cliente_id,
      observaciones: input.observaciones,
      total: String(total),
      estado: 'CREADO'
    }, tx);

    for (const item of itemsConPrecio) {
      await DetallePedidoModel.create({
        pedido_id: Number(nuevoPedido.id),
        producto_id: item.producto_id,
        precio_unitario: String(item.precio_unitario),
        cantidad: String(item.cantidad)
      }, tx);
    }

    const detalles = await DetallePedidoModel.getByPedidoId(Number(nuevoPedido.id));
    return { ...nuevoPedido, detalles };
  });
}
