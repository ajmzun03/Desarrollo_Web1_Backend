import { Router, type Request, type Response } from 'express';
import { OrdenesCompraController } from '../controllers/ordenesCompra.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /ordenes-compra?estado=&sucursal_id= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const estado = req.query.estado as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await OrdenesCompraController.getAll(estado, sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-compra/programadas — BODEGUERO o ADMIN
router.get('/programadas', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const result = await OrdenesCompraController.getProgramadas(bodegaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-compra/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await OrdenesCompraController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /ordenes-compra — ADMIN
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesCompraController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-compra/:id/agendar — ADMIN
router.patch('/:id/agendar', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesCompraController.agendar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-compra/:id/estado — ADMIN
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesCompraController.updateEstado(Number(req.params.id), req.body.estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;