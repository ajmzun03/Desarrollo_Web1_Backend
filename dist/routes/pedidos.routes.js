import { Router } from 'express';
import { PedidosController } from '../controllers/pedidos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaPedidoCreate, schemaPedidoEstado } from '../schemas/pedido.schema.js';
const router = Router();
// GET /pedidos — autenticado
/**
 * @openapi
 * /pedidos:
 *   get:
 *     summary: Listar todos los pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (_req, res) => {
    const result = await PedidosController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /pedidos/listos — DESPACHADOR o ADMIN
/**
 * @openapi
 * /pedidos/listos:
 *   get:
 *     summary: Listar pedidos en estado LISTO (DESPACHADOR o ADMIN)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos listos para despacho
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/listos', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (_req, res) => {
    const result = await PedidosController.getListos();
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /pedidos/:id — autenticado
/**
 * @openapi
 * /pedidos/{id}:
 *   get:
 *     summary: Obtener un pedido por ID con sus detalles
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado con sus detalles
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req, res) => {
    const result = await PedidosController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST /pedidos — autenticado
/**
 * @openapi
 * /pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliente_id, items]
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 example: 1
 *               observaciones:
 *                 type: string
 *                 example: Sin sal
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id:
 *                       type: integer
 *                       example: 3
 *                     cantidad:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Pedido creado con sus detalles
 *       400:
 *         description: Datos inválidos (cliente_id e items son requeridos)
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, validate(schemaPedidoCreate), async (req, res) => {
    const result = await PedidosController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
// PATCH /pedidos/:id/estado — solo ADMIN (cambio genérico de estado)
/**
 * @openapi
 * /pedidos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un pedido (solo ADMIN)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [CREADO, LISTO, ANULADO, EN_RUTA, ENTREGADO]
 *                 example: EN_RUTA
 *     responses:
 *       200:
 *         description: Estado del pedido actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), validate(schemaPedidoEstado), async (req, res) => {
    const result = await PedidosController.updateEstado(Number(req.params.id), req.body.estado);
    res.status(result.status).json({ data: result.data, error: result.error });
});
// PATCH /pedidos/:id/confirmar — ADMIN o CAJERO
/**
 * @openapi
 * /pedidos/{id}/confirmar:
 *   patch:
 *     summary: Confirmar un pedido, lo pasa a estado LISTO (ADMIN o CAJERO)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido a confirmar
 *     responses:
 *       200:
 *         description: Pedido confirmado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o CAJERO)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/confirmar', authenticate, requireRole('ADMIN', 'CAJERO'), async (req, res) => {
    const result = await PedidosController.confirmar(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// PATCH /pedidos/:id/entregado — DESPACHADOR o REPARTIDOR
/**
 * @openapi
 * /pedidos/{id}/entregado:
 *   patch:
 *     summary: Marcar un pedido como ENTREGADO (DESPACHADOR o REPARTIDOR)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido a entregar
 *     responses:
 *       200:
 *         description: Pedido marcado como entregado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o REPARTIDOR)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/entregado', authenticate, requireRole('DESPACHADOR', 'REPARTIDOR'), async (req, res) => {
    const result = await PedidosController.marcarEntregado(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=pedidos.routes.js.map