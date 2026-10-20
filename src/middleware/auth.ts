import type { Request, Response, NextFunction } from 'express';
import { getInfoToToken } from '../utils/generateToken.js';
import { estaRevocado } from '../services/sesiones.service.js';
import type { DecodedToken } from '../jwt.js';

// Extender Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  user?: DecodedToken;
}

/** true si el token pertenece a un cliente final (app de clientes). */
export function esCliente(user: DecodedToken | undefined): boolean {
  return user?.tipo === 'cliente';
}

/**
 * Middleware que verifica la presencia y validez del JWT.
 * Si es válido y no fue revocado, adjunta el payload decodificado a req.user.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

    // Los tokens temporales de 2FA (purpose) no autorizan rutas normales
    if (decoded.purpose) {
      res.status(401).json({ data: null, error: 'Token temporal no autorizado' });
      return;
    }

    if (await estaRevocado(decoded)) {
      res.status(401).json({ data: null, error: 'Sesión cerrada. Inicia sesión de nuevo.' });
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
 * Solo personal (usuarios internos). Rechaza tokens de clientes finales con 403.
 * DEBE usarse después de `authenticate`.
 */
export function staffOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ data: null, error: 'Usuario no autenticado' });
    return;
  }
  if (esCliente(req.user)) {
    res.status(403).json({ data: null, error: 'Acceso denegado. Esta ruta es solo para personal.' });
    return;
  }
  next();
}

/**
 * Solo clientes finales. DEBE usarse después de `authenticate`.
 */
export function clienteOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ data: null, error: 'Usuario no autenticado' });
    return;
  }
  if (!esCliente(req.user)) {
    res.status(403).json({ data: null, error: 'Acceso denegado. Esta ruta es solo para clientes.' });
    return;
  }
  next();
}

/**
 * Middleware que verifica que el usuario autenticado tenga uno de los roles permitidos.
 * DEBE usarse después de `authenticate`. Un token de cliente nunca coincide con un rol de personal.
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

    if (esCliente(req.user) || !userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        data: null,
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Permite el acceso a (a) un cliente final cuyo id coincide con el parámetro de ruta, o
 * (b) personal con alguno de los roles indicados. DEBE usarse después de `authenticate`.
 */
export function propioORoles(param: string, ...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ data: null, error: 'Usuario no autenticado' });
      return;
    }
    if (esCliente(req.user)) {
      if (String(req.params[param]) === String(req.user.id)) {
        next();
        return;
      }
      res.status(403).json({ data: null, error: 'Acceso denegado' });
      return;
    }
    if (req.user.rol && roles.includes(req.user.rol)) {
      next();
      return;
    }
    res.status(403).json({ data: null, error: `Acceso denegado. Roles permitidos: ${roles.join(', ')}` });
  };
}
