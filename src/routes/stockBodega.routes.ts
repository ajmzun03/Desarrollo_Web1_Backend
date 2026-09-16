import { Router, type Request, type Response } from 'express';
import { StockBodegaController } from '../controllers/stockBodega.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /stock-bodega?bodega_id= — BODEGUERO o ADMIN (solo lectura)
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const result = await StockBodegaController.getAll(bodegaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;