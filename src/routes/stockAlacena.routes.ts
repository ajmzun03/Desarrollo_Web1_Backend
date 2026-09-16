import { Router, type Request, type Response } from 'express';
import { StockAlacenaController } from '../controllers/stockAlacena.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

// GET /stock-alacena?alacena_id= — BODEGUERO o ADMIN (solo lectura)
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const alacenaId = req.query.alacena_id ? Number(req.query.alacena_id) : undefined;
  const result = await StockAlacenaController.getAll(alacenaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;