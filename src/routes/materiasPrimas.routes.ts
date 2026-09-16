import { Router, type Request, type Response } from 'express';
import { MateriasPrimasController } from '../controllers/materiasPrimas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaMateriaPrima } from '../schemas/materiaPrima.schema.js';

const router: Router = Router();

// GET — público
router.get('/', async (_req: Request, res: Response) => {
  const result = await MateriasPrimasController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST/PATCH — ADMIN o BODEGUERO
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaMateriaPrima), async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
