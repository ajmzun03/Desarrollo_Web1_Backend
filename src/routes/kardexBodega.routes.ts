import { Router, type Request, type Response } from 'express';
import { KardexBodegaController } from '../controllers/kardexBodega.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

// GET /kardex-bodega?bodega_id=&lote_id= — ADMIN (solo lectura)
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const loteId = req.query.lote_id ? Number(req.query.lote_id) : undefined;
  const result = await KardexBodegaController.getAll(bodegaId, loteId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;