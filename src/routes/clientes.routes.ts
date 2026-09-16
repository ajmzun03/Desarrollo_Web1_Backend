import { Router, type Request, type Response } from 'express';
import { ClientesController } from '../controllers/clientes.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaCliente } from '../schemas/cliente.schema.js';

const router: Router = Router();

// GET /clientes?telefono= — requiere auth
router.get('/', authenticate, async (req: Request, res: Response) => {
  const telefono = req.query.telefono as string | undefined;
  const result = await ClientesController.getAll(telefono);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /clientes/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await ClientesController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /clientes — requiere auth + validación
router.post('/', authenticate, validate(schemaCliente), async (req: Request, res: Response) => {
  const result = await ClientesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /clientes/:id
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await ClientesController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;