import { Router } from 'express';
import { OrdenesCompraController } from '../controllers/ordenesCompra.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaOrdenCompra, schemaOrdenCompraEstado } from '../schemas/ordenCompra.schema.js';
const router = Router();
// GET /ordenes-compra?estado=&sucursal_id= — autenticado
/**
 * @openapi
 * /ordenes-compra:
 *   get:
 *     summary: Listar órdenes de compra con filtros opcionales
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [CREADA, EN_PROCESO, FINALIZADO, ANULADO]
 *         description: Filtra por estado de la orden
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra por sucursal de destino
 *     responses:
 *       200:
 *         description: Lista de órdenes de compra
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req, res) => {
    const estado = req.query.estado;
    const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
    const result = await OrdenesCompraController.getAll(estado, sucursalId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /ordenes-compra/programadas — BODEGUERO o ADMIN
/**
 * @openapi
 * /ordenes-compra/programadas:
 *   get:
 *     summary: Listar órdenes de compra programadas (EN_PROCESO)
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bodega_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID de la bodega (opcional)
 *     responses:
 *       200:
 *         description: Lista de órdenes de compra programadas
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/programadas', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req, res) => {
    const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
    const result = await OrdenesCompraController.getProgramadas(bodegaId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /ordenes-compra/:id — autenticado
/**
 * @openapi
 * /ordenes-compra/{id}:
 *   get:
 *     summary: Obtener una orden de compra por ID con sus detalles
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de compra
 *     responses:
 *       200:
 *         description: Orden de compra encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Orden de compra no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req, res) => {
    const result = await OrdenesCompraController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST /ordenes-compra — ADMIN
/**
 * @openapi
 * /ordenes-compra:
 *   post:
 *     summary: Crear una nueva orden de compra (solo ADMIN)
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proveedor_id, sucursal_destino, items]
 *             properties:
 *               proveedor_id:
 *                 type: integer
 *                 example: 1
 *               sucursal_destino:
 *                 type: integer
 *                 example: 2
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [materia_prima_id, cantidad_solicitada, precio_unitario]
 *                   properties:
 *                     materia_prima_id:
 *                       type: integer
 *                     cantidad_solicitada:
 *                       type: number
 *                     precio_unitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Orden de compra creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaOrdenCompra), async (req, res) => {
    const result = await OrdenesCompraController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
// PATCH /ordenes-compra/:id/agendar — ADMIN
/**
 * @openapi
 * /ordenes-compra/{id}/agendar:
 *   patch:
 *     summary: Agendar una orden de compra (cambia su estado a EN_PROCESO, solo ADMIN)
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de compra a agendar
 *     responses:
 *       200:
 *         description: Orden de compra agendada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Orden de compra no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/agendar', authenticate, requireRole('ADMIN'), async (req, res) => {
    const result = await OrdenesCompraController.agendar(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// PATCH /ordenes-compra/:id/estado — ADMIN
/**
 * @openapi
 * /ordenes-compra/{id}/estado:
 *   patch:
 *     summary: Actualizar el estado de una orden de compra (solo ADMIN)
 *     tags: [ÓrdenesCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de compra
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
 *                 enum: [CREADA, EN_PROCESO, FINALIZADO, ANULADO]
 *                 example: FINALIZADO
 *     responses:
 *       200:
 *         description: Estado de la orden de compra actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Orden de compra no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), validate(schemaOrdenCompraEstado), async (req, res) => {
    const result = await OrdenesCompraController.updateEstado(Number(req.params.id), req.body.estado);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=ordenesCompra.routes.js.map