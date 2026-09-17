import { Router, type Request, type Response } from 'express';
import { OrdenesTrabajoController } from '../controllers/ordenesTrabajo.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaOrdenTrabajo, schemaOrdenTrabajoEstado } from '../schemas/ordenTrabajo.schema.js';

const router: Router = Router();

// GET /ordenes-trabajo?sucursal_id=&estado= — autenticado
/**
 * @openapi
 * /ordenes-trabajo:
 *   get:
 *     summary: Listar órdenes de trabajo (filtrable por sucursal y estado)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar órdenes por ID de sucursal
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [GENERADA, EN_PROCESO, ANULADA, FINALIZADA]
 *         description: Filtrar órdenes por estado
 *     responses:
 *       200:
 *         description: Lista de órdenes de trabajo
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const estado = req.query.estado as string | undefined;
  const result = await OrdenesTrabajoController.getAll(sucursalId, estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/cola — autenticado (tablet cocinero)
/**
 * @openapi
 * /ordenes-trabajo/cola:
 *   get:
 *     summary: Obtener la cola de órdenes pendientes (estado GENERADA)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar la cola por ID de sucursal
 *     responses:
 *       200:
 *         description: Cola de órdenes de trabajo pendientes
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cola', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await OrdenesTrabajoController.getCola(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/:id — autenticado
/**
 * @openapi
 * /ordenes-trabajo/{id}:
 *   get:
 *     summary: Obtener una orden de trabajo por ID
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
 *     responses:
 *       200:
 *         description: Orden de trabajo encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Orden de trabajo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /ordenes-trabajo/:id/receta — autenticado
/**
 * @openapi
 * /ordenes-trabajo/{id}/receta:
 *   get:
 *     summary: Obtener la receta asociada a una orden de trabajo
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
 *     responses:
 *       200:
 *         description: Receta de la orden de trabajo con sus detalles
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Orden de trabajo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/receta', authenticate, async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.getReceta(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /ordenes-trabajo — ADMIN
/**
 * @openapi
 * /ordenes-trabajo:
 *   post:
 *     summary: Crear una nueva orden de trabajo (solo ADMIN)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id, receta_id, cantidad_produccion]
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               receta_id:
 *                 type: integer
 *                 example: 2
 *               cantidad_produccion:
 *                 type: number
 *                 example: 40
 *     responses:
 *       201:
 *         description: Orden de trabajo creada
 *       400:
 *         description: Datos inválidos (sucursal_id, receta_id y cantidad_produccion son requeridos)
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaOrdenTrabajo), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/estado — ADMIN
/**
 * @openapi
 * /ordenes-trabajo/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de una orden de trabajo (solo ADMIN)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
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
 *                 enum: [GENERADA, EN_PROCESO, ANULADA, FINALIZADA]
 *                 example: ANULADA
 *     responses:
 *       200:
 *         description: Estado de la orden actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Orden de trabajo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), validate(schemaOrdenTrabajoEstado), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.updateEstado(Number(req.params.id), req.body.estado);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/iniciar — ADMIN (tablet cocinero)
/**
 * @openapi
 * /ordenes-trabajo/{id}/iniciar:
 *   patch:
 *     summary: Iniciar una orden de trabajo, pasa a EN_PROCESO (solo ADMIN)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo a iniciar
 *     responses:
 *       200:
 *         description: Orden de trabajo iniciada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Orden de trabajo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/iniciar', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.iniciar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /ordenes-trabajo/:id/terminar — ADMIN (tablet cocinero)
/**
 * @openapi
 * /ordenes-trabajo/{id}/terminar:
 *   patch:
 *     summary: Terminar una orden de trabajo, genera lote de producto y pasa a FINALIZADA (solo ADMIN)
 *     tags: [ÓrdenesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo a terminar
 *     responses:
 *       200:
 *         description: Orden de trabajo finalizada con su lote generado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Orden de trabajo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/terminar', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await OrdenesTrabajoController.terminar(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;