import { Router } from 'express';
import { SucursalesController } from '../controllers/sucursales.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaSucursal } from '../schemas/sucursal.schema.js';
const router = Router();
/**
 * @openapi
 * /sucursales:
 *   get:
 *     summary: Listar todas las sucursales
 *     tags: [Sucursales]
 *     responses:
 *       200:
 *         description: Lista de sucursales
 *       500:
 *         description: Error al obtener sucursales
 */
// GET — público
router.get('/', async (_req, res) => {
    const result = await SucursalesController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /sucursales/{id}:
 *   get:
 *     summary: Obtener una sucursal por ID
 *     tags: [Sucursales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal
 *     responses:
 *       200:
 *         description: Sucursal encontrada
 *       404:
 *         description: Sucursal no encontrada
 *       500:
 *         description: Error al obtener sucursal
 */
router.get('/:id', async (req, res) => {
    const result = await SucursalesController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /sucursales:
 *   post:
 *     summary: Crear una nueva sucursal (solo ADMIN)
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [municipio_id, sucursal, direccion]
 *             properties:
 *               municipio_id:
 *                 type: integer
 *                 example: 1
 *               sucursal:
 *                 type: string
 *                 example: Sucursal Centro
 *               direccion:
 *                 type: string
 *                 example: 5a Avenida 10-20
 *     responses:
 *       201:
 *         description: Sucursal creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al crear sucursal
 */
// POST/PATCH — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaSucursal), async (req, res) => {
    const result = await SucursalesController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /sucursales/{id}:
 *   patch:
 *     summary: Actualizar una sucursal existente (solo ADMIN)
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               municipio_id:
 *                 type: integer
 *                 example: 1
 *               sucursal:
 *                 type: string
 *                 example: Sucursal Centro
 *               direccion:
 *                 type: string
 *                 example: 5a Avenida 10-20
 *     responses:
 *       200:
 *         description: Sucursal actualizada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Sucursal no encontrada
 *       500:
 *         description: Error al actualizar sucursal
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
    const result = await SucursalesController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=sucursales.routes.js.map