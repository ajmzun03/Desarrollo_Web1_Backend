import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Handler global de errores para Express.
 * Captura errores no manejados y devuelve una respuesta consistente.
 *
 * Express 5 captura automáticamente errores de async handlers,
 * este middleware los formatea antes de enviar la respuesta.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message);

  // Errores de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      data: null,
      error: 'Error de validación',
      details: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Tokens JWT (por nombre, sin dependencia de @types)
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ data: null, error: 'Token expirado' });
    return;
  }
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ data: null, error: 'Token inválido' });
    return;
  }

  // Error con status personalizado (ej. from controllers)
  const status = (err as any).status ?? 500;
  const message = status === 500 ? 'Error interno del servidor' : err.message;

  res.status(status).json({ data: null, error: message });
}
