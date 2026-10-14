import { Router, type Request, type Response } from 'express';
import { InventarioController } from '../controllers/inventario.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cache, invalidateTags } from '../middleware/cache.js';
import { schemaTraslado, schemaIngresoVale, schemaCuadre } from '../schemas/inventario.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /traslados:
 *   post:
 *     summary: Traslado de insumos entre sucursales (RF-006 Bodega)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bodega_origen_id, bodega_destino_id, lote_id, cantidad]
 *             properties:
 *               bodega_origen_id:
 *                 type: integer
 *               bodega_destino_id:
 *                 type: integer
 *               lote_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *     responses:
 *       201:
 *         description: Traslado registrado con kardex de salida y entrada
 *       400:
 *         description: Datos inválidos o cantidad mayor al disponible
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       404:
 *         description: Lote o stock de origen no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/traslados', authenticate, requireRole('BODEGUERO', 'ADMIN'), validate(schemaTraslado), async (req: Request, res: Response) => {
  const result = await InventarioController.traslado(req.body);
  if (result.status < 300) await invalidateTags('inventario-bajo-minimo', 'materias-primas-criticas', 'stock-bodega', 'kardex-bodega');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /bodega/ingreso-vale:
 *   post:
 *     summary: Ingreso de producto por vale de gasto administrativo (RF-007 Bodega)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bodega_id, materia_prima_id, cantidad, fecha_vencimiento]
 *             properties:
 *               bodega_id:
 *                 type: integer
 *               materia_prima_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               fecha_vencimiento:
 *                 type: string
 *                 format: date
 *               descripcion:
 *                 type: string
 *               gasto:
 *                 type: object
 *                 properties:
 *                   sucursal_id:
 *                     type: integer
 *                   caja_id:
 *                     type: integer
 *                   usuario_id:
 *                     type: integer
 *                   monto:
 *                     type: number
 *     responses:
 *       201:
 *         description: Ingreso registrado (lote + kardex + gasto opcional)
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/bodega/ingreso-vale', authenticate, requireRole('BODEGUERO', 'ADMIN'), validate(schemaIngresoVale), async (req: Request, res: Response) => {
  const result = await InventarioController.ingresoVale(req.body);
  if (result.status < 300) await invalidateTags('inventario-bajo-minimo', 'materias-primas-criticas', 'stock-bodega', 'kardex-bodega');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /inventario/cuadre:
 *   post:
 *     summary: Cuadre diario — compara sistema vs físico y registra ajuste/merma (RF-009 Bodega)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bodega_id, items]
 *             properties:
 *               bodega_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [lote_id, cantidad_fisica]
 *                   properties:
 *                     lote_id:
 *                       type: integer
 *                     cantidad_fisica:
 *                       type: number
 *     responses:
 *       200:
 *         description: Ajustes aplicados con sus diferencias
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       404:
 *         description: Lote no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/inventario/cuadre', authenticate, requireRole('BODEGUERO', 'ADMIN'), validate(schemaCuadre), async (req: Request, res: Response) => {
  const result = await InventarioController.cuadre(req.body);
  if (result.status < 300) await invalidateTags('inventario-bajo-minimo', 'materias-primas-criticas', 'stock-bodega', 'kardex-bodega');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /inventario/bajo-minimo:
 *   get:
 *     summary: Reporte de existencia bajo el mínimo (RF-010 Bodega)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal
 *       - in: query
 *         name: umbral
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *         description: Existencia mínima aceptada
 *     responses:
 *       200:
 *         description: Lotes por debajo del mínimo
 *       400:
 *         description: sucursal_id es requerido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/inventario/bajo-minimo', authenticate, requireRole('BODEGUERO', 'ADMIN'), cache('inventario-bajo-minimo', 5), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const umbral = req.query.umbral ? Number(req.query.umbral) : undefined;
  const result = await InventarioController.getBajoMinimo(sucursalId, umbral);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
