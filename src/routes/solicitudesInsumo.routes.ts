import { Router, type Response } from 'express';
import { SolicitudesInsumoController } from '../controllers/solicitudesInsumo.controller.js';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaSolicitudInsumoCreate, schemaSolicitudInsumoEstado } from '../schemas/solicitudInsumo.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /solicitudes-insumo:
 *   get:
 *     summary: Listar todas las solicitudes de insumos (RF-003)
 *     tags: [Solicitudes Insumo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *       401:
 *         description: No autenticado
 */
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const result = await SolicitudesInsumoController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /solicitudes-insumo/sucursal/{sucursalId}:
 *   get:
 *     summary: Obtener solicitudes de insumos por sucursal
 *     tags: [Solicitudes Insumo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitudes de la sucursal
 */
router.get('/sucursal/:sucursalId', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await SolicitudesInsumoController.getBySucursal(Number(req.params.sucursalId));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /solicitudes-insumo/{id}:
 *   get:
 *     summary: Obtener una solicitud de insumo por ID con sus detalles
 *     tags: [Solicitudes Insumo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud con lista de insumos solicitados
 *       404:
 *         description: No encontrada
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await SolicitudesInsumoController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /solicitudes-insumo:
 *   post:
 *     summary: Crear una nueva solicitud de insumos (Cocina / Sucursal)
 *     tags: [Solicitudes Insumo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id, items]
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [materia_prima_id, cantidad_solicitada]
 *                   properties:
 *                     materia_prima_id:
 *                       type: integer
 *                       example: 2
 *                     cantidad_solicitada:
 *                       type: number
 *                       example: 10.5
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'JEFE_COCINA', 'COCINERO', 'BODEGUERO'),
  validate(schemaSolicitudInsumoCreate),
  async (req: AuthRequest, res: Response) => {
    const userId = Number(req.user?.id ?? 1);
    const result = await SolicitudesInsumoController.create(req.body, userId);
    res.status(result.status).json({ data: result.data, error: result.error });
  }
);

/**
 * @openapi
 * /solicitudes-insumo/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de solicitud (ENVIADA, RECIBIDA, CANCELADA)
 *     tags: [Solicitudes Insumo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 enum: [PENDIENTE, ENVIADA, RECIBIDA, CANCELADA]
 *                 example: ENVIADA
 *               detalles_recibidos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     cantidad_recibida:
 *                       type: number
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.patch(
  '/:id/estado',
  authenticate,
  requireRole('ADMIN', 'BODEGUERO', 'JEFE_COCINA'),
  validate(schemaSolicitudInsumoEstado),
  async (req: AuthRequest, res: Response) => {
    const { estado, detalles_recibidos } = req.body;
    const result = await SolicitudesInsumoController.updateEstado(Number(req.params.id), estado, detalles_recibidos);
    res.status(result.status).json({ data: result.data, error: result.error });
  }
);

export default router;
