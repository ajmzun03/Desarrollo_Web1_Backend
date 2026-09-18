import { Router } from 'express';
import { ProductosController } from '../controllers/productos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaProducto, schemaProductoUpdate, schemaProductoStockMinimo } from '../schemas/producto.schema.js';
const router = Router();
// GET — público
/**
 * @openapi
 * /productos:
 *   get:
 *     summary: Listar todos los productos (público)
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', async (_req, res) => {
    const result = await ProductosController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /productos/disponibilidad:
 *   get:
 *     summary: Obtener la disponibilidad de productos (público)
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar disponibilidad por ID de sucursal
 *     responses:
 *       200:
 *         description: Disponibilidad de productos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/disponibilidad', async (req, res) => {
    const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
    const result = await ProductosController.getDisponibilidad(sucursalId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID (público)
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', async (req, res) => {
    const result = await ProductosController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
// POST/PATCH — ADMIN o BODEGUERO
/**
 * @openapi
 * /productos:
 *   post:
 *     summary: Crear un nuevo producto (ADMIN o BODEGUERO)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria_id, unidad_medida_id, producto, precio]
 *             properties:
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               unidad_medida_id:
 *                 type: integer
 *                 example: 2
 *               producto:
 *                 type: string
 *                 example: Tortilla de maíz
 *               precio:
 *                 type: number
 *                 example: 15.5
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaProducto), async (req, res) => {
    const result = await ProductosController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /productos/{id}:
 *   patch:
 *     summary: Actualizar un producto existente (ADMIN o BODEGUERO)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoria_id:
 *                 type: integer
 *               unidad_medida_id:
 *                 type: integer
 *               producto:
 *                 type: string
 *               precio:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaProductoUpdate), async (req, res) => {
    const result = await ProductosController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /productos/{id}/stock-minimo:
 *   patch:
 *     summary: Actualizar el stock mínimo de un producto (solo ADMIN)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stock_minimo]
 *             properties:
 *               stock_minimo:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Stock mínimo actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/stock-minimo', authenticate, requireRole('ADMIN'), validate(schemaProductoStockMinimo), async (req, res) => {
    const result = await ProductosController.updateStockMinimo(Number(req.params.id), req.body.stock_minimo);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=productos.routes.js.map