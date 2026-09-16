import { Router, type Request, type Response } from 'express';
import { PedidosController } from '../controllers/pedidos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /pedidos — autenticado
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await PedidosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /pedidos/listos — DESPACHADOR o ADMIN
router.get('/listos', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (_req: Request, res: Response) => {
  const result = await PedidosController.getListos();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /pedidos/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await PedidosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /pedidos — autenticado
router.post('/', authenticate, async (req: Request, res: Response) => {
  const result = await PedidosController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/estado — solo ADMIN (cambio genérico de estado)
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await PedidosController.updateEstado(Number(req.params.id), req.body.estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/confirmar — ADMIN o CAJERO
router.patch('/:id/confirmar', authenticate, requireRole('ADMIN', 'CAJERO'), async (req: Request, res: Response) => {
  const result = await PedidosController.confirmar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/entregado — DESPACHADOR o REPARTIDOR
router.patch('/:id/entregado', authenticate, requireRole('DESPACHADOR', 'REPARTIDOR'), async (req: Request, res: Response) => {
  const result = await PedidosController.marcarEntregado(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;