import { Router, type Request, type Response } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaUsuario } from '../schemas/usuario.schema.js';

const router = Router();

// Todas las rutas requieren ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.get('/', async (_req: Request, res: Response) => {
  const result = await UsuariosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await UsuariosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.post('/', validate(schemaUsuario), async (req: Request, res: Response) => {
  const result = await UsuariosController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const result = await UsuariosController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
