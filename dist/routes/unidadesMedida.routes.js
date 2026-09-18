import { Router } from 'express';
import { UnidadesMedidaController } from '../controllers/unidadesMedida.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaUnidadMedida } from '../schemas/unidadMedida.schema.js';
const router = Router();
/**
 * @openapi
 * /unidades-medida:
 *   get:
 *     summary: Listar todas las unidades de medida
 *     tags: [Unidades de Medida]
 *     responses:
 *       200:
 *         description: Lista de unidades de medida
 *       500:
 *         description: Error al obtener unidades de medida
 */
// GET — público
router.get('/', async (_req, res) => {
    const result = await UnidadesMedidaController.getAll();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /unidades-medida/{id}:
 *   get:
 *     summary: Obtener una unidad de medida por ID
 *     tags: [Unidades de Medida]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la unidad de medida
 *     responses:
 *       200:
 *         description: Unidad de medida encontrada
 *       404:
 *         description: Unidad de medida no encontrada
 *       500:
 *         description: Error al obtener unidad de medida
 */
router.get('/:id', async (req, res) => {
    const result = await UnidadesMedidaController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /unidades-medida:
 *   post:
 *     summary: Crear una nueva unidad de medida (solo ADMIN)
 *     tags: [Unidades de Medida]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unidad, abreviatura]
 *             properties:
 *               unidad:
 *                 type: string
 *                 example: Kilogramo
 *               abreviatura:
 *                 type: string
 *                 example: kg
 *     responses:
 *       201:
 *         description: Unidad de medida creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al crear unidad de medida
 */
// POST/PATCH — solo ADMIN
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaUnidadMedida), async (req, res) => {
    const result = await UnidadesMedidaController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /unidades-medida/{id}:
 *   patch:
 *     summary: Actualizar una unidad de medida existente (solo ADMIN)
 *     tags: [Unidades de Medida]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la unidad de medida a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unidad:
 *                 type: string
 *                 example: Kilogramo
 *               abreviatura:
 *                 type: string
 *                 example: kg
 *     responses:
 *       200:
 *         description: Unidad de medida actualizada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Unidad de medida no encontrada
 *       500:
 *         description: Error al actualizar unidad de medida
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
    const result = await UnidadesMedidaController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=unidadesMedida.routes.js.map