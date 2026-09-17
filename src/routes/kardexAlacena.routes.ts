import { Router, type Request, type Response } from 'express';
import { KardexAlacenaController } from '../controllers/kardexAlacena.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /kardex-alacena:
 *   get:
 *     summary: Listar movimientos de kardex de alacena (filtrable por alacena)
 *     tags: [Kardex Alacena]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: alacena_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de alacena
 *     responses:
 *       200:
 *         description: Lista de movimientos de kardex de alacena
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener kardex de alacena
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const alacenaId = req.query.alacena_id ? Number(req.query.alacena_id) : undefined;
  const result = await KardexAlacenaController.getAll(alacenaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;