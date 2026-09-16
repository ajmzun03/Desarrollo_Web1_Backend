import { Router, type Request, type Response } from 'express';
import { RecetasController } from '../controllers/recetas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaReceta, schemaRecetaUpdate } from '../schemas/receta.schema.js';

const router: Router = Router();

// GET /recetas — autenticado
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await RecetasController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /recetas/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await RecetasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /recetas — ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaReceta), async (req: Request, res: Response) => {
  const result = await RecetasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /recetas/:id — ADMIN
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(schemaRecetaUpdate), async (req: Request, res: Response) => {
  const result = await RecetasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;