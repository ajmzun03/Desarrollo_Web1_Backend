import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import { pedidoTable, detallePedidoTable, recetaTable, recetaDetalleTable } from '../schemas/db.schema.js';
import type { SelectPedido } from '../schemas/db.schema.js';
import { consumirMateriaPrima } from './inventario.service.js';
import { calcularConsumos } from './produccion.service.js';
import { ErrorNegocio } from '../utils/errors.js';
import { TRANSICIONES_PEDIDO, validarTransicion } from '../utils/transiciones.js';

const redondear = (n: number): number => Math.round(n * 100) / 100;

/**
 * Suma los consumos de materia prima de varios productos pedidos. Función pura.
 * Cada receta rinde `cantidad_lote` unidades; se consume la parte proporcional a lo pedido.
 */
export function consumosDelPedido(
  lineas: Array<{ cantidad: number; cantidad_lote: number; ingredientes: Array<{ materia_prima_id: number; cantidad_necesaria: number | string }> }>
): Map<number, number> {
  const total = new Map<number, number>();
  for (const l of lineas) {
    for (const c of calcularConsumos(l.ingredientes, l.cantidad, l.cantidad_lote)) {
      total.set(c.materia_prima_id, redondear((total.get(c.materia_prima_id) ?? 0) + c.cantidad));
    }
  }
  return total;
}

/**
 * Pasa el pedido a EN_PREPARACION y descuenta, en la misma transacción, la materia prima de las recetas de lo
 * que se pidió (alacena de la cocina primero y luego bodega, FEFO) de la sucursal del pedido. Si falta stock
 * el pedido no cambia de estado. Los productos sin receta no consumen nada.
 */
export async function iniciarPreparacionPedido(id: number): Promise<SelectPedido> {
  return db.transaction(async (tx) => {
    const [pedido] = await tx.select().from(pedidoTable).where(eq(pedidoTable.id, id)).limit(1).for('update');
    if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
    validarTransicion(TRANSICIONES_PEDIDO, pedido.estado, 'EN_PREPARACION', 'el pedido');
    if (pedido.metodo_pago === 'TARJETA' && !pedido.pagado) {
      throw new ErrorNegocio('El pedido con tarjeta aún no tiene el pago confirmado', 409);
    }

    const detalles = await tx.select().from(detallePedidoTable).where(eq(detallePedidoTable.pedido_id, id));
    const productoIds = [...new Set(detalles.map(d => Number(d.producto_id)))];

    if (productoIds.length > 0 && pedido.sucursal_id) {
      const recetas = await tx.select().from(recetaTable)
        .where(inArray(recetaTable.producto_id, productoIds)).orderBy(asc(recetaTable.id));
      const recetaDe = new Map<number, (typeof recetas)[number]>();
      for (const r of recetas) if (r.producto_id !== null && !recetaDe.has(Number(r.producto_id))) recetaDe.set(Number(r.producto_id), r);

      const ingredientes = recetas.length > 0
        ? await tx.select().from(recetaDetalleTable).where(inArray(recetaDetalleTable.receta_id, recetas.map(r => r.id)))
        : [];

      const pedidoPorProducto = new Map<number, number>();
      for (const d of detalles) {
        pedidoPorProducto.set(Number(d.producto_id), redondear((pedidoPorProducto.get(Number(d.producto_id)) ?? 0) + Number(d.cantidad)));
      }

      const lineas = [...pedidoPorProducto].flatMap(([productoId, cantidad]) => {
        const receta = recetaDe.get(productoId);
        if (!receta) return [];
        return [{
          cantidad,
          cantidad_lote: Number(receta.cantidad_lote),
          ingredientes: ingredientes
            .filter(i => Number(i.receta_id) === Number(receta.id) && i.materia_prima_id !== null)
            .map(i => ({ materia_prima_id: Number(i.materia_prima_id), cantidad_necesaria: i.cantidad_necesaria }))
        }];
      });

      for (const [materia_prima_id, cantidad] of consumosDelPedido(lineas)) {
        await consumirMateriaPrima(tx, { sucursal_id: Number(pedido.sucursal_id), materia_prima_id, cantidad });
      }
    }

    const [actualizado] = await tx.update(pedidoTable).set({ estado: 'EN_PREPARACION' })
      .where(and(eq(pedidoTable.id, id))).returning();
    if (!actualizado) throw new Error('Error al iniciar la preparación del pedido');
    return actualizado;
  });
}
