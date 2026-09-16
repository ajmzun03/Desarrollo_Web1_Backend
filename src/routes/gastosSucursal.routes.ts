import { Router, type Request, type Response } from 'express';
import { GastosSucursalController } from '../controllers/gastosSucursal.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /gastos-sucursal?sucursal_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await GastosSucursalController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /gastos-sucursal/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await GastosSucursalController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /gastos-sucursal — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await GastosSucursalController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;