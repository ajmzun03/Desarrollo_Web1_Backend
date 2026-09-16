import { Router, type Request, type Response } from 'express';
import { FacturasVentaController } from '../controllers/facturasVenta.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /facturas-venta?pedido_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const pedidoId = req.query.pedido_id ? Number(req.query.pedido_id) : undefined;
  const result = await FacturasVentaController.getAll(pedidoId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /facturas-venta/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await FacturasVentaController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /facturas-venta — CAJERO o ADMIN
router.post('/', authenticate, requireRole('CAJERO', 'ADMIN'), async (req: Request, res: Response) => {
  const result = await FacturasVentaController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;