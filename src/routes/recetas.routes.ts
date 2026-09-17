import { Router, type Request, type Response } from 'express';
import { RecetasController } from '../controllers/recetas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaReceta, schemaRecetaUpdate } from '../schemas/receta.schema.js';

const router: Router = Router();

// GET /recetas — autenticado
/**
 * @openapi
 * /recetas:
 *   get:
 *     summary: Listar todas las recetas
 *     tags: [Recetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de recetas
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await RecetasController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /recetas/:id — autenticado
/**
 * @openapi
 * /recetas/{id}:
 *   get:
 *     summary: Obtener una receta por ID con sus detalles
 *     tags: [Recetas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la receta
 *     responses:
 *       200:
 *         description: Receta encontrada con sus detalles
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Receta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await RecetasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /recetas — ADMIN
/**
 * @openapi
 * /recetas:
 *   post:
 *     summary: Crear una nueva receta (solo ADMIN)
 *     tags: [Recetas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [producto_id, nombre, cantidad_lote]
 *             properties:
 *               producto_id:
 *                 type: integer
 *                 example: 3
 *               nombre:
 *                 type: string
 *                 example: Tortilla de harina
 *               cantidad_lote:
 *                 type: number
 *                 example: 50
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [materia_prima_id, cantidad_necesaria]
 *                   properties:
 *                     materia_prima_id:
 *                       type: integer
 *                       example: 8
 *                     cantidad_necesaria:
 *                       type: number
 *                       example: 2.5
 *     responses:
 *       201:
 *         description: Receta creada con sus detalles
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaReceta), async (req: Request, res: Response) => {
  const result = await RecetasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /recetas/:id — ADMIN
/**
 * @openapi
 * /recetas/{id}:
 *   patch:
 *     summary: Actualizar una receta existente (solo ADMIN)
 *     tags: [Recetas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la receta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               producto_id:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               cantidad_lote:
 *                 type: number
 *     responses:
 *       200:
 *         description: Receta actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Receta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(schemaRecetaUpdate), async (req: Request, res: Response) => {
  const result = await RecetasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;