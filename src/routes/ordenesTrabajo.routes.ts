import { Router, type Request, type Response } from 'express';
import { OrdenesTrabajoController } from '../controllers/ordenesTrabajo.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaOrdenTrabajo, schemaOrdenTrabajoEstado } from '../schemas/ordenTrabajo.schema.js';

const router: Router = Router();

// GET /ordenes-trabajo?sucursal_id=&estado= — autenticado
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const estado = req.query.estado as string | undefined;
  const result = await OrdenesTrabajoController.getAll(sucursalId, estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/cola — autenticado (tablet cocinero)
router.get('/cola', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await OrdenesTrabajoController.getCola(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/:id/receta — autenticado
router.get('/:id/receta', authenticate, async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.getReceta(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /ordenes-trabajo — ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaOrdenTrabajo), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/estado — ADMIN
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), validate(schemaOrdenTrabajoEstado), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.updateEstado(Number(req.params.id), req.body.estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/iniciar — ADMIN (tablet cocinero)
router.patch('/:id/iniciar', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.iniciar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/terminar — ADMIN (tablet cocinero)
router.patch('/:id/terminar', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.terminar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;