import { Router, type Request, type Response } from 'express';
import { CajasController } from '../controllers/cajas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /cajas?sucursal_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await CajasController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /cajas/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await CajasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /cajas — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await CajasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /cajas/:id — solo ADMIN
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await CajasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;