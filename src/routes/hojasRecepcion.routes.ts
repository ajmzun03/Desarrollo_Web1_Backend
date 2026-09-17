import { Router, type Request, type Response } from 'express';
import { HojasRecepcionController } from '../controllers/hojasRecepcion.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaHojaRecepcion } from '../schemas/hojaRecepcion.schema.js';

const router: Router = Router();

// GET /hojas-recepcion?sucursal_id= — BODEGUERO o ADMIN
/**
 * @openapi
 * /hojas-recepcion:
 *   get:
 *     summary: Listar hojas de recepción con filtro opcional de sucursal
 *     tags: [HojasRecepcion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra por sucursal receptora
 *     responses:
 *       200:
 *         description: Lista de hojas de recepción
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await HojasRecepcionController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /hojas-recepcion/:id — BODEGUERO o ADMIN
/**
 * @openapi
 * /hojas-recepcion/{id}:
 *   get:
 *     summary: Obtener una hoja de recepción por ID con sus detalles
 *     tags: [HojasRecepcion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la hoja de recepción
 *     responses:
 *       200:
 *         description: Hoja de recepción encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       404:
 *         description: Hoja de recepción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req: Request, res: Response) => {
  const result = await HojasRecepcionController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /hojas-recepcion — BODEGUERO o ADMIN
/**
 * @openapi
 * /hojas-recepcion:
 *   post:
 *     summary: Crear una hoja de recepción (BODEGUERO o ADMIN)
 *     tags: [HojasRecepcion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_receptora, items]
 *             properties:
 *               sucursal_receptora:
 *                 type: integer
 *                 example: 2
 *               orden_compra_id:
 *                 type: integer
 *                 example: 5
 *               tipo_recepcion:
 *                 type: string
 *                 enum: [TOTAL, PARCIAL]
 *                 example: TOTAL
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [materia_prima_id, cantidad_recibida, fecha_vencimiento]
 *                   properties:
 *                     materia_prima_id:
 *                       type: integer
 *                     cantidad_recibida:
 *                       type: number
 *                     fecha_vencimiento:
 *                       type: string
 *                       format: date
 *                     merma:
 *                       type: number
 *     responses:
 *       201:
 *         description: Hoja de recepción creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('BODEGUERO', 'ADMIN'), validate(schemaHojaRecepcion), async (req: Request, res: Response) => {
  const result = await HojasRecepcionController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;