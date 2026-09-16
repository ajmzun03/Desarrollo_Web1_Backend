import type { Request, Response, NextFunction } from 'express';
import { getInfoToToken } from '../utils/generateToken.js';
import type { DecodedToken } from '../jwt.js';

// Extender Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  user?: DecodedToken;
}

/**
 * Middleware que verifica la presencia y validez del JWT.
 * Si es válido, adjunta el payload decodificado a req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ data: null, error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1]!;

  try {
    const decoded = getInfoToToken(token);

    if (!decoded) {
      res.status(401).json({ data: null, error: 'Token inválido o expirado' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ data: null, error: 'Token expirado' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ data: null, error: 'Token inválido' });
      return;
    }
    res.status(401).json({ data: null, error: 'Error al verificar token' });
  }
}

/**
 * Middleware que verifica que el usuario autenticado tenga uno de los roles permitidos.
 * DEBE usarse después de `authenticate`.
 *
 * @example
 * router.get('/admin', authenticate, requireRole('ADMIN'), controller.getAll);
 * router.post('/bodega', authenticate, requireRole('ADMIN', 'BODEGUERO'), controller.create);
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ data: null, error: 'Usuario no autenticado' });
      return;
    }

    const userRole = req.user.rol as string;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        data: null,
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}
