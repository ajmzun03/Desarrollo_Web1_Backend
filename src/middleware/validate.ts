import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validación genérico con Zod.
 * Valida req.body contra el schema proporcionado.
 *
 * @param schema - Schema Zod a validar
 * @param source - Propiedad del request a validar (default: 'body')
 *
 * @example
 * import { validate } from '../middleware/validate.js';
 * import { schemaCliente } from '../schemas/cliente.schema.js';
 *
 * router.post('/', validate(schemaCliente), controller.create);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const formattedErrors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          data: null,
          error: 'Error de validación',
          details: formattedErrors,
        });
        return;
      }

      // Reemplazar con los datos parseados (coerciones, trim, etc.)
      (req as any)[source] = result.data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          data: null,
          error: 'Error de validación',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
