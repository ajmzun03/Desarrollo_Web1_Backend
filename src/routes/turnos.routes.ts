import { Router, type Request, type Response } from 'express';
import { TurnosController } from '../controllers/turnos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaTurnoApertura, schemaTurnoCierre, schemaTurnoValidar } from '../schemas/turno.schema.js';

const router: Router = Router();

// GET /turnos — autenticado
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await TurnosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /turnos/pendientes-validacion — ADMIN
router.get('/pendientes-validacion', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const result = await TurnosController.getPendientesValidacion();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /turnos/:id — autenticado
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await TurnosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /turnos/apertura — DESPACHADOR o ADMIN
router.post('/apertura', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaTurnoApertura), async (req: Request, res: Response) => {
  const result = await TurnosController.apertura(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /turnos/:id/cierre — DESPACHADOR o ADMIN
router.patch('/:id/cierre', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaTurnoCierre), async (req: Request, res: Response) => {
  const result = await TurnosController.cierre(Number(req.params.id), req.body.monto_cierre_declarado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /turnos/:id/validar — solo ADMIN
router.patch('/:id/validar', authenticate, requireRole('ADMIN'), validate(schemaTurnoValidar), async (req: Request, res: Response) => {
  const result = await TurnosController.validar(Number(req.params.id), req.body.monto_cierre_sistema);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;