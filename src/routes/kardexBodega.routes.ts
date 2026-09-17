import { Router, type Request, type Response } from 'express';
import { KardexBodegaController } from '../controllers/kardexBodega.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /kardex-bodega:
 *   get:
 *     summary: Listar movimientos de kardex de bodega (filtrable por bodega o lote)
 *     tags: [Kardex Bodega]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bodega_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de bodega
 *       - in: query
 *         name: lote_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de lote (tiene prioridad sobre bodega_id)
 *     responses:
 *       200:
 *         description: Lista de movimientos de kardex de bodega
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener kardex de bodega
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const loteId = req.query.lote_id ? Number(req.query.lote_id) : undefined;
  const result = await KardexBodegaController.getAll(bodegaId, loteId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;