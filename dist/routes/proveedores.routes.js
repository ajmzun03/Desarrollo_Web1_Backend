import { Router } from 'express';
import { ProveedoresController } from '../controllers/proveedores.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaProveedor } from '../schemas/proveedor.schema.js';
const router = Router();
// GET — público
/**
 * @openapi
 * /proveedores:
 *   get:
 *     summary: Listar todos los proveedores
 *     tags: [Proveedores]
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', async (_req, res) => {
    const result = await ProveedoresController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /proveedores/{id}:
 *   get:
 *     summary: Obtener un proveedor por ID
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', async (req, res) => {
    const result = await ProveedoresController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST/PATCH — solo ADMIN
/**
 * @openapi
 * /proveedores:
 *   post:
 *     summary: Crear un nuevo proveedor (solo ADMIN)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [noNit, proveedor]
 *             properties:
 *               noNit:
 *                 type: string
 *                 example: '123456789'
 *               proveedor:
 *                 type: string
 *                 example: Distribuidora XYZ
 *               direccion:
 *                 type: string
 *                 example: Av. Principal 123
 *     responses:
 *       201:
 *         description: Proveedor creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaProveedor), async (req, res) => {
    const result = await ProveedoresController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /proveedores/{id}:
 *   patch:
 *     summary: Actualizar un proveedor existente (solo ADMIN)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proveedor:
 *                 type: string
 *                 example: Distribuidora XYZ
 *               direccion:
 *                 type: string
 *                 example: Av. Principal 456
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
    const result = await ProveedoresController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=proveedores.routes.js.map