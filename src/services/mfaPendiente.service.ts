import { randomUUID } from 'node:crypto'
import { redis } from './redis.js'
import { IS_PROD } from '../config.js'
import logger from '../config/logger.js'
import type { SesionSupabase } from './supabaseAuth.service.js'

/**
 * Sesión pendiente de verificación: entre el login (contraseña correcta) y el código TOTP, el
 * servidor guarda la sesión intermedia de Supabase. Nunca se envía al navegador: el cliente solo
 * recibe un tmpToken que apunta a este registro por su id.
 *
 * Redis en producción (obligatorio: sin él el login responde 503). En desarrollo, si Redis no está
 * disponible, usa la memoria del proceso.
 */

export type EstadoMfa = 'verificar' | 'enrolar'

export interface MfaPendiente {
  usuarioId: number
  sesion: SesionSupabase
  mfa: EstadoMfa
  /** Factor TOTP a verificar (existente, o el recién enrolado). */
  factorId?: string
}

const TTL_SEGUNDOS = 600
export const MAX_INTENTOS = 5

const clavePend = (sid: string) => `mfa:pend:${sid}`
const claveIntentos = (sid: string) => `mfa:intentos:${sid}`

// Respaldo en memoria (solo desarrollo)
const memoria = new Map<string, { valor: MfaPendiente; vence: number }>()
const intentosMemoria = new Map<string, number>()

/** true si se puede guardar el estado: Redis listo, o desarrollo con memoria. */
export function almacenDisponible(): boolean {
  return redis.isReady || !IS_PROD
}

export function nuevoId(): string {
  return randomUUID()
}

export async function guardar(sid: string, valor: MfaPendiente): Promise<boolean> {
  if (redis.isReady) {
    try {
      await redis.set(clavePend(sid), JSON.stringify(valor), { EX: TTL_SEGUNDOS })
      return true
    } catch (err) {
      logger.error({ err }, 'Error guardando MFA pendiente en Redis')
      if (IS_PROD) return false
    }
  } else if (IS_PROD) {
    return false
  }
  memoria.set(sid, { valor, vence: Date.now() + TTL_SEGUNDOS * 1000 })
  return true
}

export async function obtener(sid: string): Promise<MfaPendiente | null> {
  if (redis.isReady) {
    try {
      const raw = await redis.get(clavePend(sid))
      return raw ? (JSON.parse(raw) as MfaPendiente) : null
    } catch (err) {
      logger.error({ err }, 'Error leyendo MFA pendiente de Redis')
      if (IS_PROD) return null
    }
  } else if (IS_PROD) {
    return null
  }
  const item = memoria.get(sid)
  if (!item) return null
  if (item.vence < Date.now()) {
    memoria.delete(sid)
    return null
  }
  return item.valor
}

/** Actualiza el registro conservando el tiempo de vida restante. */
export async function actualizar(sid: string, valor: MfaPendiente): Promise<void> {
  if (redis.isReady) {
    try {
      await redis.set(clavePend(sid), JSON.stringify(valor), { KEEPTTL: true })
      return
    } catch (err) {
      logger.error({ err }, 'Error actualizando MFA pendiente en Redis')
      if (IS_PROD) return
    }
  }
  const item = memoria.get(sid)
  if (item) memoria.set(sid, { valor, vence: item.vence })
}

export async function destruir(sid: string): Promise<void> {
  memoria.delete(sid)
  intentosMemoria.delete(sid)
  if (!redis.isReady) return
  try {
    await redis.del([clavePend(sid), claveIntentos(sid)])
  } catch (err) {
    logger.error({ err }, 'Error eliminando MFA pendiente de Redis')
  }
}

/**
 * Cuenta un intento fallido de forma atómica (INCR) y devuelve el total. El contador vive lo mismo
 * que la sesión pendiente. Al llegar a MAX_INTENTOS el llamador destruye la sesión.
 */
export async function registrarIntentoFallido(sid: string): Promise<number> {
  if (redis.isReady) {
    try {
      const total = await redis.incr(claveIntentos(sid))
      if (total === 1) await redis.expire(claveIntentos(sid), TTL_SEGUNDOS)
      return total
    } catch (err) {
      logger.error({ err }, 'Error contando intento MFA en Redis')
      if (IS_PROD) return MAX_INTENTOS // falla cerrado
    }
  } else if (IS_PROD) {
    return MAX_INTENTOS
  }
  const total = (intentosMemoria.get(sid) ?? 0) + 1
  intentosMemoria.set(sid, total)
  return total
}
