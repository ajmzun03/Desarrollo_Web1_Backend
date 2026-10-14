import { Router, type Request, type Response } from 'express';
import { CombosController } from '../controllers/combos.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cache, invalidateTags } from '../middleware/cache.js';
import { schemaComboCreate, schemaComboUpdate } from '../schemas/combo.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /combos:
 *   get:
 *     summary: Listar todos los combos activos del menú
 *     tags: [Combos]
 *     responses:
 *       200:
 *         description: Lista de combos
 */
router.get('/', cache('combos', 300), async (_req: Request, res: Response) => {
  const result = await CombosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /combos/{id}:
 *   get:
 *     summary: Obtener un combo por ID con sus productos incluidos
 *     tags: [Combos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del combo y detalle de productos
 *       404:
 *         description: Combo no encontrado
 */
router.get('/:id', cache('combos', 300), async (req: Request, res: Response) => {
  const result = await CombosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /combos:
 *   post:
 *     summary: Crear un nuevo combo (solo ADMIN)
 *     tags: [Combos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, precio, items]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Combo Familiar Doble
 *               precio:
 *                 type: number
 *                 example: 95.00
 *               imagen:
 *                 type: string
 *                 example: https://mi-bucket.s3.amazonaws.com/uploads/combo.png
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id:
 *                       type: integer
 *                       example: 1
 *                     cantidad:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Combo creado exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaComboCreate), async (req: Request, res: Response) => {
  const result = await CombosController.create(req.body);
  if (result.status < 300) await invalidateTags('combos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /combos/{id}:
 *   patch:
 *     summary: Actualizar un combo (solo ADMIN)
 *     tags: [Combos]
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
 *         description: Combo actualizado
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(schemaComboUpdate), async (req: Request, res: Response) => {
  const result = await CombosController.update(Number(req.params.id), req.body);
  if (result.status < 300) await invalidateTags('combos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /combos/{id}:
 *   delete:
 *     summary: Desactivar un combo (solo ADMIN)
 *     tags: [Combos]
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
 *         description: Combo desactivado
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await CombosController.delete(Number(req.params.id));
  if (result.status < 300) await invalidateTags('combos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
