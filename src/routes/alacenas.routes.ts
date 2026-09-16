import { Router, type Request, type Response } from 'express';
import { AlacenasController } from '../controllers/alacenas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /alacenas?bodega_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const result = await AlacenasController.getAll(bodegaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /alacenas/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await AlacenasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /alacenas — ADMIN o BODEGUERO
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await AlacenasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /alacenas/:id — ADMIN o BODEGUERO
router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await AlacenasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;