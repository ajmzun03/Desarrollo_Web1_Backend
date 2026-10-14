import { Router, type Request, type Response } from 'express';
import { AlacenasController } from '../controllers/alacenas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { invalidateTags } from '../middleware/cache.js';
import { schemaMerma } from '../schemas/inventario.schema.js';

const alacenaRouter: Router = Router();

/**
 * @openapi
 * /alacenas:
 *   get:
 *     summary: Listar alacenas, opcionalmente filtradas por bodega
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bodega_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID de la bodega para filtrar las alacenas
 *     responses:
 *       200:
 *         description: Lista de alacenas
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error al obtener alacenas
 */
// GET /alacenas?bodega_id= — autenticado
alacenaRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
  const result = await AlacenasController.getAll(bodegaId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /alacenas/vencimientos:
 *   get:
 *     summary: Monitoreo de vencimientos en alacena (RF-005 Cocina)
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: alacena_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alacena
 *       - in: query
 *         name: dias
 *         required: false
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Días de anticipación para el vencimiento
 *     responses:
 *       200:
 *         description: Lotes próximos a vencer o vencidos
 *       400:
 *         description: alacena_id es requerido
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
alacenaRouter.get('/vencimientos', authenticate, async (req: Request, res: Response) => {
  const alacenaId = req.query.alacena_id ? Number(req.query.alacena_id) : undefined;
  const dias = req.query.dias ? Number(req.query.dias) : undefined;
  const result = await AlacenasController.getVencimientos(alacenaId, dias);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /alacenas/mermas:
 *   post:
 *     summary: Reportar merma/vencido — mueve kardex, nunca inserta directo (RF-006 Cocina)
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alacena_id, lote_id, cantidad]
 *             properties:
 *               alacena_id:
 *                 type: integer
 *               lote_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               tipo:
 *                 type: string
 *                 enum: [MERMA, VENCIMIENTO, SALIDA, TRASLADO]
 *                 default: MERMA
 *     responses:
 *       201:
 *         description: Merma registrada en kardex
 *       400:
 *         description: Datos inválidos o cantidad mayor al disponible
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Lote no encontrado
 *       500:
 *         description: Error interno del servidor
 */
alacenaRouter.post('/mermas', authenticate, validate(schemaMerma), async (req: Request, res: Response) => {
  const result = await AlacenasController.merma(req.body);
  if (result.status < 300) await invalidateTags('stock-alacena', 'kardex-alacena', 'inventario-bajo-minimo', 'materias-primas-criticas');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /alacenas/{id}:
 *   get:
 *     summary: Obtener una alacena por ID
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alacena
 *     responses:
 *       200:
 *         description: Alacena encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alacena no encontrada
 *       500:
 *         description: Error al obtener alacena
 */
// GET /alacenas/:id — autenticado
alacenaRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await AlacenasController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /alacenas:
 *   post:
 *     summary: Crear una nueva alacena (ADMIN o BODEGUERO)
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alacena]
 *             properties:
 *               bodega_id:
 *                 type: integer
 *                 example: 1
 *               alacena:
 *                 type: string
 *                 example: Alacena Principal
 *     responses:
 *       201:
 *         description: Alacena creada
 *       400:
 *         description: Datos inválidos (alacena es requerido)
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       500:
 *         description: Error al crear alacena
 */
// POST /alacenas — ADMIN o BODEGUERO
alacenaRouter.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await AlacenasController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /alacenas/{id}:
 *   patch:
 *     summary: Actualizar una alacena existente (ADMIN o BODEGUERO)
 *     tags: [Alacenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alacena a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bodega_id:
 *                 type: integer
 *                 example: 1
 *               alacena:
 *                 type: string
 *                 example: Alacena Secundaria
 *     responses:
 *       200:
 *         description: Alacena actualizada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       404:
 *         description: Alacena no encontrada
 *       500:
 *         description: Error al actualizar alacena
 */
// PATCH /alacenas/:id — ADMIN o BODEGUERO
alacenaRouter.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), async (req: Request, res: Response) => {
  const result = await AlacenasController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default alacenaRouter;