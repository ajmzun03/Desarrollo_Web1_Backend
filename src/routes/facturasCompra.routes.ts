import { Router, type Request, type Response } from 'express';
import { FacturasCompraController } from '../controllers/facturasCompra.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /facturas-compra — autenticado
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await FacturasCompraController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /facturas-compra/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await FacturasCompraController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /facturas-compra — ADMIN
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await FacturasCompraController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;