import { inArray, eq, and } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import {
  productoTable,
  productoExtraTable,
  direccionTable,
  comboTable,
  comboDetalleTable,
  pedidoTable,
  detallePedidoTable,
  detalleProductoExtraTable
} from '../schemas/db.schema.js';
import type { SelectPedido, SelectDetallePedido } from '../schemas/db.schema.js';
import { ErrorNegocio } from '../utils/errors.js';

export interface ItemPedidoInput {
  /** Exactamente uno de producto_id / combo_id */
  producto_id?: number | undefined;
  combo_id?: number | undefined;
  cantidad: number;
  extras?: Array<{ producto_extra_id: number; cantidad?: number | undefined }> | undefined;
}

export interface CrearPedidoInput {
  cliente_id: number;
  observaciones?: string | undefined;
  direccion_id?: number | undefined;
  sucursal_id?: number | undefined;
  metodo_pago?: 'EFECTIVO' | 'TARJETA' | undefined;
  tipo_entrega?: 'DOMICILIO' | 'RECOGER' | undefined;
  items: ItemPedidoInput[];
}

export interface ProductoCatalogo { id: number; precio: string | number; activo: boolean }
export interface ComboCatalogo {
  id: number;
  precio: string | number;
  activo: boolean;
  detalles: Array<{ producto_id: number; cantidad: string | number }>;
}
export interface ExtraCatalogo { id: number; producto_id: number; precio: string | number; activo: boolean }

export interface LineaPedido {
  producto_id: number;
  cantidad: number;
  precio_cents: number;
  extras: Array<{ producto_extra_id: number; cantidad: number; precio_cents: number }>;
}

const aCentavos = (valor: string | number): number => Math.round(Number(valor) * 100);

/**
 * Valida los ítems contra el catálogo y calcula los precios (en centavos) desde el
 * servidor. Lanza ErrorNegocio si un producto/extra no existe, está inactivo o el
 * extra no pertenece al producto. Nunca asume precio 0.
 */
export function calcularLineas(
  items: ItemPedidoInput[],
  productos: ProductoCatalogo[],
  extras: ExtraCatalogo[],
  combos: ComboCatalogo[] = []
): { lineas: LineaPedido[]; totalCents: number } {
  const porProducto = new Map(productos.map(p => [Number(p.id), p]));
  const porExtra = new Map(extras.map(e => [Number(e.id), e]));
  const porCombo = new Map(combos.map(c => [Number(c.id), c]));
  let totalCents = 0;

  const lineas = items.flatMap((item): LineaPedido[] => {
    if (item.combo_id !== undefined && item.producto_id !== undefined) {
      throw new ErrorNegocio('Cada ítem es un producto o un combo, no ambos', 400);
    }

    // ---- Combo: se expande en sus productos (para que stock y despacho sigan por producto)
    if (item.combo_id !== undefined) {
      if ((item.extras ?? []).length > 0) throw new ErrorNegocio('Los combos no admiten extras', 400);
      const combo = porCombo.get(item.combo_id);
      if (!combo) throw new ErrorNegocio(`El combo ${item.combo_id} no existe`, 400);
      if (!combo.activo) throw new ErrorNegocio(`El combo ${item.combo_id} no está disponible`, 409);
      if (combo.detalles.length === 0) throw new ErrorNegocio(`El combo ${item.combo_id} no tiene productos`, 409);
      const comboCents = aCentavos(combo.precio);
      if (!Number.isFinite(comboCents) || comboCents <= 0) {
        throw new ErrorNegocio(`El combo ${item.combo_id} no tiene un precio válido`, 409);
      }

      const pesos = combo.detalles.map(d => {
        const producto = porProducto.get(Number(d.producto_id));
        if (!producto) throw new ErrorNegocio(`El producto ${d.producto_id} del combo no existe`, 409);
        if (!producto.activo) throw new ErrorNegocio(`El producto ${d.producto_id} del combo no está disponible`, 409);
        return Math.max(aCentavos(producto.precio) * Number(d.cantidad), 0);
      });
      const totalPeso = pesos.reduce((acc, p) => acc + p, 0);

      // El total del pedido usa el precio del combo; el precio de cada producto se prorratea
      totalCents += Math.round(comboCents * item.cantidad);
      return combo.detalles.map((d, i) => {
        const parte = totalPeso > 0 ? (comboCents * pesos[i]!) / totalPeso : comboCents / combo.detalles.length;
        return {
          producto_id: Number(d.producto_id),
          cantidad: Number(d.cantidad) * item.cantidad,
          precio_cents: Math.round(parte / Number(d.cantidad)),
          extras: []
        };
      });
    }

    // ---- Producto
    if (item.producto_id === undefined) throw new ErrorNegocio('Cada ítem requiere producto_id o combo_id', 400);
    const producto = porProducto.get(item.producto_id);
    if (!producto) throw new ErrorNegocio(`El producto ${item.producto_id} no existe`, 400);
    if (!producto.activo) throw new ErrorNegocio(`El producto ${item.producto_id} no está disponible`, 409);

    const precio_cents = aCentavos(producto.precio);
    if (!Number.isFinite(precio_cents) || precio_cents <= 0) {
      throw new ErrorNegocio(`El producto ${item.producto_id} no tiene un precio válido`, 409);
    }
    totalCents += Math.round(precio_cents * item.cantidad);

    const lineaExtras = (item.extras ?? []).map(sel => {
      const extra = porExtra.get(sel.producto_extra_id);
      if (!extra) throw new ErrorNegocio(`El extra ${sel.producto_extra_id} no existe`, 400);
      if (Number(extra.producto_id) !== item.producto_id) {
        throw new ErrorNegocio(`El extra ${sel.producto_extra_id} no pertenece al producto ${item.producto_id}`, 400);
      }
      if (!extra.activo) throw new ErrorNegocio(`El extra ${sel.producto_extra_id} no está disponible`, 409);
      const cantidad = (sel.cantidad ?? 1) * item.cantidad;
      const extraCents = aCentavos(extra.precio);
      totalCents += Math.round(extraCents * cantidad);
      return { producto_extra_id: sel.producto_extra_id, cantidad, precio_cents: extraCents };
    });

    return [{ producto_id: item.producto_id, cantidad: item.cantidad, precio_cents, extras: lineaExtras }];
  });

  return { lineas, totalCents };
}

export async function crearPedido(
  input: CrearPedidoInput
): Promise<SelectPedido & { detalles: SelectDetallePedido[] }> {
  const tipoEntrega = input.tipo_entrega ?? (input.direccion_id ? 'DOMICILIO' : 'RECOGER');
  if (tipoEntrega === 'DOMICILIO' && !input.direccion_id) {
    throw new ErrorNegocio('direccion_id es requerido para pedidos a domicilio', 400);
  }

  return db.transaction(async (tx) => {
    const comboIds = [...new Set(input.items.flatMap(i => (i.combo_id !== undefined ? [i.combo_id] : [])))];
    const combosBD = comboIds.length > 0
      ? await tx.select().from(comboTable).where(inArray(comboTable.id, comboIds))
      : [];
    const detallesCombo = comboIds.length > 0
      ? await tx.select().from(comboDetalleTable).where(inArray(comboDetalleTable.combo_id, comboIds))
      : [];
    const combos: ComboCatalogo[] = combosBD.map(c => ({
      id: Number(c.id),
      precio: c.precio,
      activo: c.activo,
      detalles: detallesCombo.filter(d => Number(d.combo_id) === Number(c.id))
        .map(d => ({ producto_id: Number(d.producto_id), cantidad: d.cantidad }))
    }));

    const productoIds = [...new Set([
      ...input.items.flatMap(i => (i.producto_id !== undefined ? [i.producto_id] : [])),
      ...combos.flatMap(c => c.detalles.map(d => d.producto_id))
    ])];
    const extraIds = [...new Set(input.items.flatMap(i => (i.extras ?? []).map(e => e.producto_extra_id)))];

    const productos = productoIds.length > 0
      ? await tx.select().from(productoTable).where(inArray(productoTable.id, productoIds))
      : [];
    const extras = extraIds.length > 0
      ? await tx.select().from(productoExtraTable).where(inArray(productoExtraTable.id, extraIds))
      : [];

    const { lineas, totalCents } = calcularLineas(input.items, productos, extras, combos);

    if (input.direccion_id) {
      const [direccion] = await tx.select().from(direccionTable)
        .where(and(eq(direccionTable.id, input.direccion_id), eq(direccionTable.cliente_id, input.cliente_id)))
        .limit(1);
      if (!direccion) throw new ErrorNegocio('La dirección no existe o no pertenece al cliente', 400);
    }

    const [pedido] = await tx.insert(pedidoTable).values({
      cliente_id: input.cliente_id,
      observaciones: input.observaciones,
      total: (totalCents / 100).toFixed(2),
      estado: 'CREADO',
      direccion_id: input.direccion_id,
      sucursal_id: input.sucursal_id,
      metodo_pago: input.metodo_pago ?? 'EFECTIVO',
      tipo_entrega: tipoEntrega
    }).returning();
    if (!pedido) throw new Error('Error al crear el pedido');

    for (const linea of lineas) {
      const [detalle] = await tx.insert(detallePedidoTable).values({
        pedido_id: Number(pedido.id),
        producto_id: linea.producto_id,
        precio_unitario: (linea.precio_cents / 100).toFixed(2),
        cantidad: String(linea.cantidad)
      }).returning();
      if (!detalle) throw new Error('Error al crear el detalle del pedido');

      for (const extra of linea.extras) {
        await tx.insert(detalleProductoExtraTable).values({
          detalle_pedido_id: Number(detalle.id),
          producto_extra_id: extra.producto_extra_id,
          cantidad: String(extra.cantidad),
          precio_unitario: (extra.precio_cents / 100).toFixed(2)
        });
      }
    }

    const detalles = await tx.select().from(detallePedidoTable)
      .where(eq(detallePedidoTable.pedido_id, Number(pedido.id)));
    return { ...pedido, detalles };
  });
}
