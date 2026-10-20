import { createHash, randomInt } from 'node:crypto'
import { redis } from './redis.js'
import { IS_PROD } from '../config.js'
import logger from '../config/logger.js'

export type OtpScope = 'login' | 'reset'
export type OtpTargetType = 'usuario' | 'cliente'
export type OtpVerdict = 'ok' | 'invalido' | 'expirado' | 'agotado'

const OTP_TTL_SECONDS = 300
const MAX_INTENTOS = 5
const MAX_ENVIOS = 3
const VENTANA_ENVIOS_SECONDS = 900

function otpKey(scope: OtpScope, targetType: OtpTargetType, targetId: number): string {
  return `otp:${scope}:${targetType}:${targetId}`
}

function otpLimitKey(scope: OtpScope, targetType: OtpTargetType, targetId: number): string {
  return `otp:limit:${scope}:${targetType}:${targetId}`
}

function hashCodigo(codigo: string): string {
  return createHash('sha256').update(codigo).digest('hex')
}

export function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/**
 * Guarda el código hasheado en Redis con TTL. Sobreescribe código previo.
 * Si Redis no está listo, devuelve false (el llamador decide degradar).
 */
export async function guardarCodigo(
  scope: OtpScope,
  targetType: OtpTargetType,
  targetId: number,
  codigo: string
): Promise<boolean> {
  if (!redis.isReady) return false
  try {
    const payload = JSON.stringify({ hash: hashCodigo(codigo), intentos: 0 })
    await redis.set(otpKey(scope, targetType, targetId), payload, { EX: OTP_TTL_SECONDS })
    return true
  } catch (err) {
    logger.error({ err, scope, targetType, targetId }, 'Error guardando OTP en Redis')
    return false
  }
}

/**
 * Verifica el código. Incrementa intentos; a MAX_INTENTOS fallas borra la key.
 * Al acertar también la borra. 'expirado' cuando la key ya no existe.
 */
export async function verificarCodigo(
  scope: OtpScope,
  targetType: OtpTargetType,
  targetId: number,
  codigo: string
): Promise<OtpVerdict> {
  if (!redis.isReady) return 'expirado'
  const key = otpKey(scope, targetType, targetId)
  try {
    const raw = await redis.get(key)
    if (raw === null) return 'expirado'

    const stored = JSON.parse(raw) as { hash: string; intentos: number }
    if (stored.hash !== hashCodigo(codigo)) {
      const intentos = stored.intentos + 1
      if (intentos >= MAX_INTENTOS) {
        await redis.del(key)
        logger.warn({ scope, targetType, targetId }, 'OTP agotado tras intentos fallidos')
        return 'agotado'
      }
      await redis.set(key, JSON.stringify({ hash: stored.hash, intentos }), { EX: OTP_TTL_SECONDS })
      return 'invalido'
    }

    await redis.del(key)
    return 'ok'
  } catch (err) {
    logger.error({ err, scope, targetType, targetId }, 'Error verificando OTP en Redis')
    return 'expirado'
  }
}

/**
 * Rate limit de envíos OTP por usuario y por scope (login y reset no comparten cupo, así que
 * pedir códigos de recuperación de otra persona no le bloquea el login): max MAX_ENVIOS por VENTANA_ENVIOS_SECONDS.
 * Devuelve false si se superó el límite.
 * En producción, si Redis no está listo devuelve false (falla cerrado).
 */
export async function puedeGenerarCodigo(
  targetType: OtpTargetType,
  targetId: number,
  scope: OtpScope = 'login'
): Promise<boolean> {
  if (!redis.isReady) return !IS_PROD // en prod falla cerrado; en dev degrada
  const key = otpLimitKey(scope, targetType, targetId)
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, VENTANA_ENVIOS_SECONDS)
    }
    return count <= MAX_ENVIOS
  } catch (err) {
    logger.error({ err, targetType, targetId }, 'Error consultando rate limit OTP')
    return !IS_PROD // en prod falla cerrado también ante errores
  }
}
