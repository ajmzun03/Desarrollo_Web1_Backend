import { Router, type Request, type Response } from 'express';
import { PedidosController } from '../controllers/pedidos.controller.js';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /repartidor/pedidos:
 *   get:
 *     summary: Pedidos asignados en ruta del repartidor (RF-001 Repartidor)
 *     tags: [Repartidor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: repartidor_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID del repartidor (usa el del token si se omite)
 *     responses:
 *       200:
 *         description: Lista de pedidos con su hoja de despacho
 *       400:
 *         description: repartidor_id es requerido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (REPARTIDOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pedidos', authenticate, requireRole('REPARTIDOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const repartidorId = req.query.repartidor_id
    ? Number(req.query.repartidor_id)
    : (req.user?.id ? Number(req.user.id) : undefined);
  const result = await PedidosController.getPedidosRepartidor(repartidorId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
