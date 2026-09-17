import { Router, type Request, type Response } from 'express';
import { FacturasVentaController } from '../controllers/facturasVenta.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaFacturaVenta } from '../schemas/facturaVenta.schema.js';

const router: Router = Router();

// GET /facturas-venta?pedido_id= — autenticado
/**
 * @openapi
 * /facturas-venta:
 *   get:
 *     summary: Listar facturas de venta (filtrable por pedido)
 *     tags: [FacturasVenta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pedido_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar facturas por ID de pedido
 *     responses:
 *       200:
 *         description: Lista de facturas de venta
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const pedidoId = req.query.pedido_id ? Number(req.query.pedido_id) : undefined;
  const result = await FacturasVentaController.getAll(pedidoId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /facturas-venta/:id — autenticado
/**
 * @openapi
 * /facturas-venta/{id}:
 *   get:
 *     summary: Obtener una factura de venta por ID
 *     tags: [FacturasVenta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura de venta
 *     responses:
 *       200:
 *         description: Factura de venta encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Factura de venta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await FacturasVentaController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /facturas-venta — CAJERO o ADMIN
/**
 * @openapi
 * /facturas-venta:
 *   post:
 *     summary: Crear una factura de venta (CAJERO o ADMIN)
 *     tags: [FacturasVenta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pedido_id, serie, numero, total]
 *             properties:
 *               pedido_id:
 *                 type: integer
 *                 example: 5
 *               serie:
 *                 type: string
 *                 example: F001
 *               numero:
 *                 type: string
 *                 example: "000123"
 *               fecha_emision:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-09-17T12:00:00"
 *               total:
 *                 type: number
 *                 example: 125.5
 *     responses:
 *       201:
 *         description: Factura de venta creada
 *       400:
 *         description: Datos inválidos (pedido_id, serie, numero y total son requeridos)
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (CAJERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('CAJERO', 'ADMIN'), validate(schemaFacturaVenta), async (req: Request, res: Response) => {
  const result = await FacturasVentaController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;