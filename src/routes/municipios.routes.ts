import { Router, type Request, type Response } from 'express';
import { MunicipiosController } from '../controllers/municipios.controller.js';

const router: Router = Router();

// GET /municipios?departamento_id= — público (dato semilla)
router.get('/', async (req: Request, res: Response) => {
  const departamentoId = req.query.departamento_id ? Number(req.query.departamento_id) : undefined;
  const result = await MunicipiosController.getAll(departamentoId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /departamentos — público (dato semilla)
router.get('/departamentos', async (_req: Request, res: Response) => {
  const result = await MunicipiosController.getDepartamentos();
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;