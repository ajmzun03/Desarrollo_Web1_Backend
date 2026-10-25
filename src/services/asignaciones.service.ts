import { eq } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import { hojaDespachoTable, pedidoTable } from '../schemas/db.schema.js';
import { ErrorNegocio } from '../utils/errors.js';
import type { DecodedToken } from '../jwt.js';

/** Un pedido asignado a un repartidor mediante una hoja de despacho. */
export interface AsignacionRepartidor {
  pedido_id: number;
  cliente_id: number;
  direccion_id: number | null;
  estado: string;
}

/**
 * Pedidos que un repartidor tiene asignados (hojas de despacho con su `repartidor_id`).
 * Es la base de lo que su vista puede mostrar: sus pedidos, y los clientes y direcciones de esos pedidos.
 */
export async function asignacionesDe(repartidorId: number): Promise<AsignacionRepartidor[]> {
  const filas = await db
    .select({
      pedido_id: pedidoTable.id,
      cliente_id: pedidoTable.cliente_id,
      direccion_id: pedidoTable.direccion_id,
      estado: pedidoTable.estado
    })
    .from(hojaDespachoTable)
    .innerJoin(pedidoTable, eq(pedidoTable.id, hojaDespachoTable.pedido_id))
    .where(eq(hojaDespachoTable.repartidor_id, repartidorId));

  return filas.map(f => ({
    pedido_id: Number(f.pedido_id),
    cliente_id: Number(f.cliente_id),
    direccion_id: f.direccion_id === null ? null : Number(f.direccion_id),
    estado: f.estado
  }));
}

export const tienePedido = (a: AsignacionRepartidor[], pedidoId: number): boolean =>
  a.some(x => x.pedido_id === pedidoId);
export const tieneCliente = (a: AsignacionRepartidor[], clienteId: number): boolean =>
  a.some(x => x.cliente_id === clienteId);
export const tieneDireccion = (a: AsignacionRepartidor[], direccionId: number): boolean =>
  a.some(x => x.direccion_id === direccionId);

export const esRepartidor = (user: DecodedToken | undefined): boolean => user?.rol === 'REPARTIDOR';

/**
 * Para un REPARTIDOR exige que el recurso pertenezca a un pedido suyo; si no, responde 404 (no revela
 * que existe). Para cualquier otro usuario no hace nada (sus permisos ya los resolvió el middleware).
 */
export async function exigirAsignado(
  user: DecodedToken,
  recurso: 'pedido' | 'cliente' | 'direccion',
  id: number
): Promise<void> {
  if (!esRepartidor(user)) return;
  const asignaciones = await asignacionesDe(Number(user.id));
  const permitido =
    recurso === 'pedido' ? tienePedido(asignaciones, id)
    : recurso === 'cliente' ? tieneCliente(asignaciones, id)
    : tieneDireccion(asignaciones, id);
  if (!permitido) throw new ErrorNegocio('No encontrado', 404);
}
