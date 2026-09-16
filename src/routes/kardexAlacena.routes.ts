import { Router, type Request, type Response } from 'express';
import { KardexAlacenaController } from '../controllers/kardexAlacena.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /kardex-alacena?alacena_id= — ADMIN (solo lectura)
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const alacenaId = req.query.alacena_id ? Number(req.query.alacena_id) : undefined;
  const result = await KardexAlacenaController.getAll(alacenaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;