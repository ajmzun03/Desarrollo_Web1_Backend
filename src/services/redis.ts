import { createClient } from 'redis'
import { REDIS_URL } from '../config.js'
import logger from '../config/logger.js'

export const redis = createClient({
  url: REDIS_URL,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
})

let lastErrorLog = 0
redis.on('error', (err) => {
  // Evita spam: como máximo 1 log cada 30s mientras Redis siga caído
  const now = Date.now()
  if (now - lastErrorLog > 30_000) {
    lastErrorLog = now
    logger.warn({ err: err.message }, 'Redis error (se reintenta en background)')
  }
})
redis.on('ready', () => {
  lastErrorLog = 0
  logger.info('Redis conectado')
})

/**
 * Intenta conectar con un timeout. Nunca lanza excepción.
 * Devuelve true si Redis quedó listo; false si no (la app puede seguir sin él).
 * Si el connect falla/timeout, el client sigue reintentando en background
 * según reconnectStrategy: la sesión/caché se recuperan sin reiniciar.
 */
export async function connectRedis(timeoutMs = 5000): Promise<boolean> {
  if (redis.isOpen) return redis.isReady
  try {
    await Promise.race([
      redis.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`connect timeout tras ${timeoutMs}ms`)), timeoutMs)
      )
    ])
    return redis.isReady
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'Redis no disponible al iniciar; se continúa con almacenamiento en memoria'
    )
    return false
  }
}

/** Ping real con timeout. Devuelve 'ok' | 'error' | 'down'. */
export async function redisHealth(): Promise<'ok' | 'error' | 'down'> {
  if (!redis.isReady) return 'down'
  try {
    const reply = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('ping timeout')), 2000))
    ])
    return reply === 'PONG' ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}
