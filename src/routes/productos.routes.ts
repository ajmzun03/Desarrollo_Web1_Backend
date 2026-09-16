import { Router, type Request, type Response } from 'express';
import { ProductosController } from '../controllers/productos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET — público
router.get('/', async (_req: Request, res: Response) => {
  const result = await ProductosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/disponibilidad', async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ProductosController.getDisponibilidad(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await ProductosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST/PATCH — ADMIN o BODEGUERO
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await ProductosController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await ProductosController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id/stock-minimo', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await ProductosController.updateStockMinimo(Number(req.params.id), req.body.stock_minimo);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
