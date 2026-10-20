import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

/**
 * Asigna un id a cada petición (header X-Request-Id; respeta el que envíe el proxy) y registra
 * una línea al terminar con método, ruta, status y duración. Permite seguir una petición en los logs.
 * No registra cuerpos ni headers (podrían contener credenciales).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const entrante = req.headers['x-request-id'];
  const id = typeof entrante === 'string' && /^[\w-]{8,64}$/.test(entrante) ? entrante : randomUUID();
  res.setHeader('X-Request-Id', id);
  const inicio = process.hrtime.bigint();

  res.on('finish', () => {
    // /health lo consulta la plataforma cada pocos segundos: no ensucia los logs
    if (req.path === '/health') return;
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    const nivel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[nivel]({ reqId: id, metodo: req.method, ruta: req.path, status: res.statusCode, ms: Math.round(ms) }, 'request');
  });
  next();
}
