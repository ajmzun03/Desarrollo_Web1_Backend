import { Router } from 'express';
import { HojasDespachoController } from '../controllers/hojasDespacho.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaHojaDespacho } from '../schemas/hojaDespacho.schema.js';
const router = Router();
// GET /hojas-despacho — DESPACHADOR o ADMIN
/**
 * @openapi
 * /hojas-despacho:
 *   get:
 *     summary: Listar todas las hojas de despacho
 *     tags: [HojasDespacho]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de hojas de despacho
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (_req, res) => {
    const result = await HojasDespachoController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /hojas-despacho/:id — DESPACHADOR o ADMIN
/**
 * @openapi
 * /hojas-despacho/{id}:
 *   get:
 *     summary: Obtener una hoja de despacho por ID con sus detalles
 *     tags: [HojasDespacho]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la hoja de despacho
 *     responses:
 *       200:
 *         description: Hoja de despacho encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       404:
 *         description: Hoja de despacho no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, requireRole('DESPACHADOR', 'ADMIN'), async (req, res) => {
    const result = await HojasDespachoController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST /hojas-despacho — DESPACHADOR o ADMIN
/**
 * @openapi
 * /hojas-despacho:
 *   post:
 *     summary: Crear una hoja de despacho (DESPACHADOR o ADMIN)
 *     tags: [HojasDespacho]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pedido_id, sucursal_despacho]
 *             properties:
 *               pedido_id:
 *                 type: integer
 *                 example: 3
 *               sucursal_despacho:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [producto_lote_id, cantidad_despachada]
 *                   properties:
 *                     producto_lote_id:
 *                       type: integer
 *                     cantidad_despachada:
 *                       type: number
 *     responses:
 *       201:
 *         description: Hoja de despacho creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaHojaDespacho), async (req, res) => {
    const result = await HojasDespachoController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=hojasDespacho.routes.js.map