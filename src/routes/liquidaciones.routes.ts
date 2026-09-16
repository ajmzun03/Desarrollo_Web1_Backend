import { Router, type Request, type Response } from 'express';
import { LiquidacionesController } from '../controllers/liquidaciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /liquidaciones?turno_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const turnoId = req.query.turno_id ? Number(req.query.turno_id) : undefined;
  const result = await LiquidacionesController.getAll(turnoId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /liquidaciones/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await LiquidacionesController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /liquidaciones — REPARTIDOR o ADMIN
router.post('/', authenticate, requireRole('REPARTIDOR', 'ADMIN'), async (req: Request, res: Response) => {
  const result = await LiquidacionesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;