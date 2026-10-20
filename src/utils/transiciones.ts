import { ErrorNegocio } from './errors.js'

export type MapaTransiciones<E extends string> = Record<E, readonly E[]>

export const TRANSICIONES_PEDIDO: MapaTransiciones<
  'CREADO' | 'EN_PREPARACION' | 'LISTO' | 'EN_DESPACHO' | 'EN_RUTA' | 'ENTREGADO' | 'ANULADO'
> = {
  CREADO: ['EN_PREPARACION', 'LISTO', 'ANULADO'],
  EN_PREPARACION: ['LISTO', 'ANULADO'],
  LISTO: ['EN_DESPACHO', 'EN_RUTA', 'ENTREGADO', 'ANULADO'],
  EN_DESPACHO: ['EN_RUTA', 'ENTREGADO', 'ANULADO'],
  EN_RUTA: ['ENTREGADO', 'ANULADO'],
  ENTREGADO: [],
  ANULADO: []
}

export const TRANSICIONES_ORDEN_TRABAJO: MapaTransiciones<
  'GENERADA' | 'EN_PREPARACION' | 'ANULADA' | 'FINALIZADA'
> = {
  GENERADA: ['EN_PREPARACION', 'ANULADA'],
  EN_PREPARACION: ['FINALIZADA', 'ANULADA'],
  ANULADA: [],
  FINALIZADA: []
}

export const TRANSICIONES_ORDEN_COMPRA: MapaTransiciones<
  'CREADA' | 'EN_PREPARACION' | 'FINALIZADO' | 'ANULADO'
> = {
  CREADA: ['EN_PREPARACION', 'ANULADO'],
  EN_PREPARACION: ['FINALIZADO', 'ANULADO'],
  FINALIZADO: [],
  ANULADO: []
}

export const TRANSICIONES_SOLICITUD_INSUMO: MapaTransiciones<
  'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'CANCELADA'
> = {
  PENDIENTE: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['RECIBIDA', 'CANCELADA'],
  RECIBIDA: [],
  CANCELADA: []
}

/** Lanza ErrorNegocio 409 si `desde -> hacia` no es una transición permitida. */
export function validarTransicion<E extends string>(
  mapa: MapaTransiciones<E>,
  desde: E | null | undefined,
  hacia: E,
  entidad: string
): void {
  if (!desde) return
  if (desde === hacia) {
    throw new ErrorNegocio(`${entidad} ya está en estado ${hacia}`, 409)
  }
  if (!mapa[desde]?.includes(hacia)) {
    throw new ErrorNegocio(`No se puede pasar ${entidad} de ${desde} a ${hacia}`, 409)
  }
}
