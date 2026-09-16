import { Router, type Request, type Response } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /auth/login — público
router.post('/login', async (req: Request, res: Response) => {
  const { usuario, contrasenia } = req.body;
  const result = await AuthController.login(usuario, contrasenia);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /auth/logout — público
router.post('/logout', async (_req: Request, res: Response) => {
  const result = await AuthController.logout();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /auth/me — requiere autenticación
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1]!;
  const result = await AuthController.me(token);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
