import { Router, type Request, type Response } from 'express';
import { GastosSucursalController } from '../controllers/gastosSucursal.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaGastoSucursal } from '../schemas/gastoSucursal.schema.js';

const router: Router = Router();

// GET /gastos-sucursal?sucursal_id= — autenticado
/**
 * @openapi
 * /gastos-sucursal:
 *   get:
 *     summary: Listar gastos de sucursal con filtro opcional de sucursal
 *     tags: [GastosSucursal]
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
 *         description: Lista de gastos de sucursal
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await GastosSucursalController.getAll(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /gastos-sucursal/:id — autenticado
/**
 * @openapi
 * /gastos-sucursal/{id}:
 *   get:
 *     summary: Obtener un gasto de sucursal por ID
 *     tags: [GastosSucursal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto de sucursal
 *     responses:
 *       200:
 *         description: Gasto de sucursal encontrado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Gasto de sucursal no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await GastosSucursalController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /gastos-sucursal — solo ADMIN
/**
 * @openapi
 * /gastos-sucursal:
 *   post:
 *     summary: Crear un gasto de sucursal (solo ADMIN)
 *     tags: [GastosSucursal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id]
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               caja_id:
 *                 type: integer
 *                 example: 2
 *               usuario_id:
 *                 type: integer
 *                 example: 3
 *               monto_apertura:
 *                 type: number
 *                 example: 200
 *               monto_cierre_declarado:
 *                 type: number
 *                 example: 180
 *               monto_cierre_sistema:
 *                 type: number
 *                 example: 185
 *     responses:
 *       201:
 *         description: Gasto de sucursal creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaGastoSucursal), async (req: Request, res: Response) => {
  const result = await GastosSucursalController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;