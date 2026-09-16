import { Router, type Request, type Response } from 'express';
import { DireccionesController } from '../controllers/direcciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /direcciones?cliente_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const clienteId = req.query.cliente_id ? Number(req.query.cliente_id) : undefined;
  const result = await DireccionesController.getAll(clienteId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /direcciones/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await DireccionesController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /direcciones — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await DireccionesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /direcciones/:id — solo ADMIN
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await DireccionesController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;