import rateLimit, { ipKeyGenerator, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';

const MENSAJE_BLOQUEO = { data: null, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' };

/**
 * Clave por IP + identificador del cuerpo (usuario/correo/identificador).
 * Así, los fallos de un empleado no bloquean a otro detrás de la misma IP.
 */
function claveIpMasIdentificador(req: Request): string {
  const cuerpo = (req.body ?? {}) as Record<string, unknown>;
  const identificador = cuerpo.usuario ?? cuerpo.correo_electronico ?? cuerpo.identificador ?? '';
  const ip = req.ip ?? '';
  return `${ipKeyGenerator(ip)}|${String(identificador)}`;
}

function clavePorIp(req: Request): string {
  return ipKeyGenerator(req.ip ?? '');
}

interface Opciones {
  /** Ventana en minutos */
  ventanaMinutos: number;
  /** Intentos fallidos permitidos dentro de la ventana */
  limite: number;
  /** Si true, agrega el identificador del cuerpo a la clave */
  porIdentificador?: boolean;
}

/**
 * Limitador para rutas de autenticación.
 * - `skipSuccessfulRequests`: los aciertos NO consumen presupuesto (un login
 *   normal ya no gasta 2 intentos de 5).
 * - Clave por IP + identificador (opcional): evita que los fallos de un
 *   usuario bloqueen a otro detrás de la misma IP/sucursal.
 */
export function crearAuthLimiter({ ventanaMinutos, limite, porIdentificador = false }: Opciones): RateLimitRequestHandler {
  return rateLimit({
    windowMs: ventanaMinutos * 60 * 1000,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: porIdentificador ? claveIpMasIdentificador : clavePorIp,
    message: MENSAJE_BLOQUEO,
  });
}
