import { Router, type Request, type Response } from 'express';
import { BodegasController } from '../controllers/bodegas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /bodegas?sucursal_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await BodegasController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /bodegas/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await BodegasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /bodegas/lotes/fefo — BODEGUERO o ADMIN
router.get('/lotes/fefo', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const materiaPrimaId = req.query.materia_prima_id ? Number(req.query.materia_prima_id) : undefined;
  const result = await BodegasController.getLotesFEFO(bodegaId, materiaPrimaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /bodegas — ADMIN o BODEGUERO
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await BodegasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /bodegas/:id — ADMIN o BODEGUERO
router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await BodegasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;