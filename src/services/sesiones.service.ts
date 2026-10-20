import { redis } from './redis.js'
import logger from '../config/logger.js'
import type { DecodedToken } from '../jwt.js'

// Los tokens duran 1 día; la marca de revocación vive un poco más.
const TTL_REVOCACION_USUARIO = 2 * 24 * 60 * 60

function tipoDe(decoded: Pick<DecodedToken, 'tipo'>): string {
  return decoded.tipo ?? 'usuario'
}

/** Revoca un token concreto (logout) hasta que expire. */
export async function revocarToken(jti: string | undefined, exp: number | undefined): Promise<boolean> {
  if (!jti || !redis.isReady) return false
  const segundos = Math.max((exp ?? 0) - Math.floor(Date.now() / 1000), 1)
  try {
    await redis.set(`revoked:jti:${jti}`, '1', { EX: segundos })
    return true
  } catch (err) {
    logger.error({ err }, 'No se pudo revocar el token')
    return false
  }
}

/** Invalida todas las sesiones emitidas antes de ahora (desactivación, cambio de clave). */
export async function revocarSesionesDe(tipo: 'usuario' | 'cliente', id: number): Promise<boolean> {
  if (!redis.isReady) return false
  try {
    await redis.set(`revoked:since:${tipo}:${id}`, String(Math.floor(Date.now() / 1000)), {
      EX: TTL_REVOCACION_USUARIO
    })
    return true
  } catch (err) {
    logger.error({ err }, 'No se pudieron revocar las sesiones')
    return false
  }
}

/**
 * ¿El token fue revocado? Si Redis no responde se permite (los login ya
 * fallan cerrado en producción sin Redis, así que no se emiten tokens nuevos).
 */
export async function estaRevocado(decoded: DecodedToken): Promise<boolean> {
  if (!redis.isReady) return false
  try {
    if (decoded.jti && (await redis.exists(`revoked:jti:${decoded.jti}`)) > 0) return true
    const desde = await redis.get(`revoked:since:${tipoDe(decoded)}:${decoded.id}`)
    if (desde !== null && typeof decoded.iat === 'number' && decoded.iat <= Number(desde)) return true
    return false
  } catch (err) {
    logger.warn({ err }, 'No se pudo consultar revocación de sesión')
    return false
  }
}
