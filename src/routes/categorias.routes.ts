import { Router, type Request, type Response } from 'express';
import { CategoriasController } from '../controllers/categorias.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaCategoria } from '../schemas/categoria.schema.js';

const router: Router = Router();

// GET — público
router.get('/', async (_req: Request, res: Response) => {
  const result = await CategoriasController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await CategoriasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST/PATCH — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaCategoria), async (req: Request, res: Response) => {
  const result = await CategoriasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await CategoriasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
