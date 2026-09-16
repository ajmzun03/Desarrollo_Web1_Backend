import { Router, type Request, type Response } from 'express';
import { UnidadesMedidaController } from '../controllers/unidadesMedida.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaUnidadMedida } from '../schemas/unidadMedida.schema.js';

const router = Router();

// GET — público
router.get('/', async (_req: Request, res: Response) => {
  const result = await UnidadesMedidaController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await UnidadesMedidaController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST/PATCH — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaUnidadMedida), async (req: Request, res: Response) => {
  const result = await UnidadesMedidaController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await UnidadesMedidaController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
