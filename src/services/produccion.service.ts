import { eq } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import {
  ordenTrabajoTable,
  recetaTable,
  recetaDetalleTable,
  productoLoteTable
} from '../schemas/db.schema.js';
import type { SelectOrdenTrabajo, SelectProductoLote } from '../schemas/db.schema.js';
import { consumirMateriaPrima } from './inventario.service.js';
import { ErrorNegocio } from '../utils/errors.js';
import { TRANSICIONES_ORDEN_TRABAJO, validarTransicion } from '../utils/transiciones.js';

const redondear = (n: number): number => Math.round(n * 100) / 100;

export interface IngredienteNecesario {
  materia_prima_id: number;
  cantidad_necesaria: number | string;
}

/**
 * Cantidad de cada ingrediente para producir `cantidadProduccion` unidades de un producto
 * cuya receta rinde `cantidadLote` unidades con las cantidades indicadas. Función pura.
 */
export function calcularConsumos(
  ingredientes: IngredienteNecesario[],
  cantidadProduccion: number,
  cantidadLote: number
): Array<{ materia_prima_id: number; cantidad: number }> {
  if (!(cantidadLote > 0)) throw new ErrorNegocio('La receta tiene una cantidad de lote inválida', 409);
  if (!(cantidadProduccion > 0)) throw new ErrorNegocio('La orden tiene una cantidad de producción inválida', 409);
  const factor = cantidadProduccion / cantidadLote;
  return ingredientes
    .map(i => ({ materia_prima_id: Number(i.materia_prima_id), cantidad: redondear(Number(i.cantidad_necesaria) * factor) }))
    .filter(c => c.cantidad > 0);
}

/**
 * Termina una orden de trabajo en una sola transacción:
 *  1. exige que esté EN_PREPARACION (bloquea la fila para que no se termine dos veces),
 *  2. descuenta del inventario (alacena y luego bodega, FEFO) la materia prima de la receta,
 *  3. crea el lote de producto terminado y
 *  4. marca la orden como FINALIZADA.
 */
export async function terminarOrdenTrabajo(
  id: number
): Promise<{ orden: SelectOrdenTrabajo; lote: SelectProductoLote }> {
  return db.transaction(async (tx) => {
    const [orden] = await tx.select().from(ordenTrabajoTable)
      .where(eq(ordenTrabajoTable.id, id)).limit(1).for('update');
    if (!orden) throw new ErrorNegocio('Orden de trabajo no encontrada', 404);
    validarTransicion(TRANSICIONES_ORDEN_TRABAJO, orden.estado, 'FINALIZADA', 'la orden de trabajo');

    if (!orden.receta_id) throw new ErrorNegocio('La orden de trabajo no tiene receta asociada', 400);
    if (!orden.sucursal_id) throw new ErrorNegocio('La orden de trabajo no tiene sucursal', 400);

    const [receta] = await tx.select().from(recetaTable).where(eq(recetaTable.id, orden.receta_id)).limit(1);
    if (!receta?.producto_id) throw new ErrorNegocio('La receta de la orden no tiene producto asociado', 400);

    const ingredientes = await tx.select().from(recetaDetalleTable).where(eq(recetaDetalleTable.receta_id, receta.id));
    const consumos = calcularConsumos(
      ingredientes.filter(i => i.materia_prima_id !== null).map(i => ({
        materia_prima_id: Number(i.materia_prima_id), cantidad_necesaria: i.cantidad_necesaria
      })),
      Number(orden.cantidad_produccion),
      Number(receta.cantidad_lote)
    );

    for (const consumo of consumos) {
      await consumirMateriaPrima(tx, {
        sucursal_id: orden.sucursal_id,
        materia_prima_id: consumo.materia_prima_id,
        cantidad: consumo.cantidad
      });
    }

    const [lote] = await tx.insert(productoLoteTable).values({
      orden_id: id,
      producto_id: receta.producto_id,
      cantidad_inicial: orden.cantidad_produccion,
      cantidad_actual: orden.cantidad_produccion,
      estado: 'VIGENTE'
    }).returning();
    if (!lote) throw new Error('Error al crear el lote de producto');

    const [ordenActualizada] = await tx.update(ordenTrabajoTable)
      .set({ estado: 'FINALIZADA' })
      .where(eq(ordenTrabajoTable.id, id))
      .returning();
    if (!ordenActualizada) throw new Error('Error al finalizar la orden de trabajo');

    return { orden: ordenActualizada, lote };
  });
}
