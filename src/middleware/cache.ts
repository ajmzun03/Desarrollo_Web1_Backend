import type { Request, RequestHandler, Response } from 'express';
import { redis } from '../services/redis.js';

/**
 * Key: cache:{tag}:{originalUrl} (incluye query params).
 * Se usan tags para invalidar en bloque al escribir.
 */
function cacheKey(tag: string, req: Request): string {
  return `cache:${tag}:${req.originalUrl}`;
}

// Limites de la clave de caché: una query demasiado larga o con demasiados parámetros no se cachea,
// así nadie puede llenar Redis variando parámetros arbitrarios.
const MAX_LARGO_URL = 200;
const MAX_PARAMS = 5;

function esCacheable(req: Request): boolean {
  return req.originalUrl.length <= MAX_LARGO_URL && Object.keys(req.query ?? {}).length <= MAX_PARAMS;
}

/**
 * Caché de Redis para rutas GET.
 * - Si Redis no está listo, la petición pasa directo (sin caché, sin romper).
 * - HIT: responde el JSON guardado sin tocar el controller.
 * - MISS: ejecuta el handler y guarda la respuesta 200 con el TTL indicado.
 * - Agrega header X-Cache: HIT|MISS para depuración.
 *
 * Usar solo en endpoints cuya respuesta NO depende del usuario
 * (nunca en /me, turnos, pagos ni nada que lea req.user).
 */
export function cache(tag: string, ttlSeconds: number): RequestHandler {
  return (req: Request, res: Response, next) => {
    if (req.method !== 'GET' || !redis.isReady || !esCacheable(req)) return next();

    const key = cacheKey(tag, req);
    redis
      .get(key)
      .then((hit) => {
        if (hit !== null) {
          res.setHeader('X-Cache', 'HIT');
          res.type('application/json').send(hit);
          return;
        }

        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
          if (res.statusCode === 200) {
            res.setHeader('X-Cache', 'MISS');
            redis
              .set(key, JSON.stringify(body), { EX: ttlSeconds })
              .catch(() => {});
          }
          return originalJson(body);
        };
        next();
      })
      .catch(() => next());
  };
}

/**
 * Borra todas las keys cacheadas de los tags indicados (SCAN + DEL).
 * Llamar tras cada escritura que afecte datos cacheados. No lanza errores:
 * si Redis está caído simplemente no invalida (el TTL se encarga).
 */
export async function invalidateTags(...tags: string[]): Promise<void> {
  if (!redis.isReady || tags.length === 0) return;
  for (const tag of tags) {
    try {
      for await (const keys of redis.scanIterator({ MATCH: `cache:${tag}:*`, COUNT: 100 })) {
        const list = Array.isArray(keys) ? keys : [keys];
        if (list.length > 0) await redis.del(list);
      }
    } catch {
      // Redis cayó entre el check y el SCAN: el TTL cubre el resto
    }
  }
}
