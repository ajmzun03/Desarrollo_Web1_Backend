import { Router } from 'express';
import { FacturasCompraController } from '../controllers/facturasCompra.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaFacturaCompra } from '../schemas/facturaCompra.schema.js';
const router = Router();
// GET /facturas-compra — autenticado
/**
 * @openapi
 * /facturas-compra:
 *   get:
 *     summary: Listar todas las facturas de compra
 *     tags: [FacturasCompra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facturas de compra
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (_req, res) => {
    const result = await FacturasCompraController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
// GET /facturas-compra/:id — autenticado
/**
 * @openapi
 * /facturas-compra/{id}:
 *   get:
 *     summary: Obtener una factura de compra por ID
 *     tags: [FacturasCompra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura de compra
 *     responses:
 *       200:
 *         description: Factura de compra encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Factura de compra no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req, res) => {
    const result = await FacturasCompraController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST /facturas-compra — ADMIN
/**
 * @openapi
 * /facturas-compra:
 *   post:
 *     summary: Crear una nueva factura de compra (solo ADMIN)
 *     tags: [FacturasCompra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hoja_recepcion_id, serie, numero, fecha_emision, total]
 *             properties:
 *               hoja_recepcion_id:
 *                 type: integer
 *                 example: 1
 *               serie:
 *                 type: string
 *                 example: A
 *               numero:
 *                 type: string
 *                 example: '0001'
 *               fecha_emision:
 *                 type: string
 *                 format: date
 *                 example: '2026-09-17'
 *               total:
 *                 type: number
 *                 example: 1250.5
 *     responses:
 *       201:
 *         description: Factura de compra creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaFacturaCompra), async (req, res) => {
    const result = await FacturasCompraController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=facturasCompra.routes.js.map