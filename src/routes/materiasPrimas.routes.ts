import { Router, type Request, type Response } from 'express';
import { MateriasPrimasController } from '../controllers/materiasPrimas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaMateriaPrima } from '../schemas/materiaPrima.schema.js';

const router: Router = Router();

// GET — público
/**
 * @openapi
 * /materias-primas:
 *   get:
 *     summary: Listar todas las materias primas
 *     tags: [MateriasPrimas]
 *     responses:
 *       200:
 *         description: Lista de materias primas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', async (_req: Request, res: Response) => {
  const result = await MateriasPrimasController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /materias-primas/{id}:
 *   get:
 *     summary: Obtener una materia prima por ID
 *     tags: [MateriasPrimas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la materia prima
 *     responses:
 *       200:
 *         description: Materia prima encontrada
 *       404:
 *         description: Materia prima no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST/PATCH — ADMIN o BODEGUERO
/**
 * @openapi
 * /materias-primas:
 *   post:
 *     summary: Crear una nueva materia prima (ADMIN o BODEGUERO)
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria_id, unidad_medida_id, materia_prima, es_perecedera, maneja_merma]
 *             properties:
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               unidad_medida_id:
 *                 type: integer
 *                 example: 3
 *               materia_prima:
 *                 type: string
 *                 example: Harina de trigo
 *               es_perecedera:
 *                 type: boolean
 *                 example: true
 *               maneja_merma:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Materia prima creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaMateriaPrima), async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /materias-primas/{id}:
 *   patch:
 *     summary: Actualizar una materia prima existente (ADMIN o BODEGUERO)
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la materia prima a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materia_prima:
 *                 type: string
 *                 example: Harina de maíz
 *               es_perecedera:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Materia prima actualizada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       404:
 *         description: Materia prima no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await MateriasPrimasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
