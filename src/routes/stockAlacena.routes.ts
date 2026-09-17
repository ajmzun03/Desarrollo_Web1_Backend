import { Router, type Request, type Response } from 'express';
import { StockAlacenaController } from '../controllers/stockAlacena.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /stock-alacena:
 *   get:
 *     summary: Listar stock de alacena (filtrable por alacena)
 *     tags: [Stock Alacena]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: alacena_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar el stock por ID de alacena
 *     responses:
 *       200:
 *         description: Lista de stock de alacena
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error al obtener stock de alacena
 */
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const alacenaId = req.query.alacena_id ? Number(req.query.alacena_id) : undefined;
  const result = await StockAlacenaController.getAll(alacenaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;