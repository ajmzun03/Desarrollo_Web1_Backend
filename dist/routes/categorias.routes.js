import { Router } from 'express';
import { CategoriasController } from '../controllers/categorias.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaCategoria } from '../schemas/categoria.schema.js';
const router = Router();
/**
 * @openapi
 * /categorias:
 *   get:
 *     summary: Listar todas las categorías
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/', async (_req, res) => {
    const result = await CategoriasController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /categorias/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/:id', async (req, res) => {
    const result = await CategoriasController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /categorias:
 *   post:
 *     summary: Crear una nueva categoría (solo ADMIN)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria_id, descripcion]
 *             properties:
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               descripcion:
 *                 type: string
 *                 example: Bebidas
 *     responses:
 *       201:
 *         description: Categoría creada
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaCategoria), async (req, res) => {
    const result = await CategoriasController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /categorias/{id}:
 *   patch:
 *     summary: Actualizar una categoría existente (solo ADMIN)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *                 example: Bebidas frías
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Categoría no encontrada
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
    const result = await CategoriasController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=categorias.routes.js.map