import { Router, type Request, type Response } from 'express';
import { HojasDespachoController } from '../controllers/hojasDespacho.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaHojaDespacho } from '../schemas/hojaDespacho.schema.js';

const router: Router = Router();

// GET /hojas-despacho — DESPACHADOR o ADMIN
router.get('/', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (_req: Request, res: Response) => {
  const result = await HojasDespachoController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /hojas-despacho/:id — DESPACHADOR o ADMIN
router.get('/:id', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (req: Request, res: Response) => {
  const result = await HojasDespachoController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /hojas-despacho — DESPACHADOR o ADMIN
router.post('/', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaHojaDespacho), async (req: Request, res: Response) => {
  const result = await HojasDespachoController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;