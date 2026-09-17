import { Router, type Request, type Response } from 'express';
import { LiquidacionesController } from '../controllers/liquidaciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaLiquidacion } from '../schemas/liquidacion.schema.js';

const router: Router = Router();

// GET /liquidaciones?turno_id= — autenticado
/**
 * @openapi
 * /liquidaciones:
 *   get:
 *     summary: Listar liquidaciones con filtro opcional de turno
 *     tags: [Liquidaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: turno_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra por turno
 *     responses:
 *       200:
 *         description: Lista de liquidaciones
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const turnoId = req.query.turno_id ? Number(req.query.turno_id) : undefined;
  const result = await LiquidacionesController.getAll(turnoId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /liquidaciones/:id — autenticado
/**
 * @openapi
 * /liquidaciones/{id}:
 *   get:
 *     summary: Obtener una liquidación de repartidor por ID
 *     tags: [Liquidaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la liquidación
 *     responses:
 *       200:
 *         description: Liquidación encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Liquidación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await LiquidacionesController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /liquidaciones — REPARTIDOR o ADMIN
/**
 * @openapi
 * /liquidaciones:
 *   post:
 *     summary: Crear una liquidación de repartidor (REPARTIDOR o ADMIN)
 *     tags: [Liquidaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [turno_id, repartidor_id]
 *             properties:
 *               turno_id:
 *                 type: integer
 *                 example: 2
 *               repartidor_id:
 *                 type: integer
 *                 example: 5
 *               monto_entregado_repartidor:
 *                 type: number
 *                 example: 300
 *               monto_recaudado_efectivo:
 *                 type: number
 *                 example: 200
 *               monto_recaudado_voucher:
 *                 type: number
 *                 example: 150
 *     responses:
 *       201:
 *         description: Liquidación creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (REPARTIDOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('REPARTIDOR', 'ADMIN'), validate(schemaLiquidacion), async (req: Request, res: Response) => {
  const result = await LiquidacionesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;