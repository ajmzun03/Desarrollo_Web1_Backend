import { Router, type Request, type Response } from 'express';
import { CajasController } from '../controllers/cajas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaCaja, schemaCajaUpdate } from '../schemas/caja.schema.js';

const router: Router = Router();

// GET /cajas?sucursal_id= — autenticado
/**
 * @openapi
 * /cajas:
 *   get:
 *     summary: Listar cajas con filtro opcional de sucursal
 *     tags: [Cajas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra por sucursal
 *     responses:
 *       200:
 *         description: Lista de cajas
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await CajasController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /cajas/:id — autenticado
/**
 * @openapi
 * /cajas/{id}:
 *   get:
 *     summary: Obtener una caja por ID
 *     tags: [Cajas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la caja
 *     responses:
 *       200:
 *         description: Caja encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Caja no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await CajasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /cajas — solo ADMIN
/**
 * @openapi
 * /cajas:
 *   post:
 *     summary: Crear una nueva caja (solo ADMIN)
 *     tags: [Cajas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id, nombre]
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Caja Principal
 *               tipo:
 *                 type: string
 *                 enum: [CAJA_CHICA, GASTOS_REPRESENTACION, TRANSITO]
 *                 example: CAJA_CHICA
 *     responses:
 *       201:
 *         description: Caja creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaCaja), async (req: Request, res: Response) => {
  const result = await CajasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /cajas/:id — solo ADMIN
/**
 * @openapi
 * /cajas/{id}:
 *   patch:
 *     summary: Actualizar una caja existente (solo ADMIN)
 *     tags: [Cajas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la caja a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Caja Secundaria
 *               tipo:
 *                 type: string
 *                 enum: [CAJA_CHICA, GASTOS_REPRESENTACION, TRANSITO]
 *     responses:
 *       200:
 *         description: Caja actualizada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Caja no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(schemaCajaUpdate), async (req: Request, res: Response) => {
  const result = await CajasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;