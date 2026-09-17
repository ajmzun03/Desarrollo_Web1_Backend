import { Router, type Request, type Response } from 'express';
import { StockBodegaController } from '../controllers/stockBodega.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /stock-bodega:
 *   get:
 *     summary: Listar stock de bodega (filtrable por bodega)
 *     tags: [Stock Bodega]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bodega_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar el stock por ID de bodega
 *     responses:
 *       200:
 *         description: Lista de stock de bodega
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error al obtener stock de bodega
 */
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const result = await StockBodegaController.getAll(bodegaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;