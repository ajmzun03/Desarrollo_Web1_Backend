import { Router, type Request, type Response } from 'express';
import { HojasRecepcionController } from '../controllers/hojasRecepcion.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaHojaRecepcion } from '../schemas/hojaRecepcion.schema.js';

const router: Router = Router();

// GET /hojas-recepcion?sucursal_id= — BODEGUERO o ADMIN
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await HojasRecepcionController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /hojas-recepcion/:id — BODEGUERO o ADMIN
router.get('/:id', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const result = await HojasRecepcionController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /hojas-recepcion — BODEGUERO o ADMIN
router.post('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), validate(schemaHojaRecepcion), async (req: Request, res: Response) => {
  const result = await HojasRecepcionController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;