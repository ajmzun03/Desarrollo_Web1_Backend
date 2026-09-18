import { Router } from 'express';
import { BodegasController } from '../controllers/bodegas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaBodega, schemaBodegaUpdate } from '../schemas/bodega.js';
const router = Router();
/**
 * @openapi
 * /bodegas:
 *   get:
 *     summary: Listar todas las bodegas (filtrable por sucursal)
 *     tags: [Bodegas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar bodegas por ID de sucursal
 *     responses:
 *       200:
 *         description: Lista de bodegas
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error al obtener bodegas
 */
router.get('/', authenticate, async (req, res) => {
    const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
    const result = await BodegasController.getAll(sucursalId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /bodegas/{id}:
 *   get:
 *     summary: Obtener una bodega por ID
 *     tags: [Bodegas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la bodega
 *     responses:
 *       200:
 *         description: Bodega encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Bodega no encontrada
 *       500:
 *         description: Error al obtener bodega
 */
router.get('/:id', authenticate, async (req, res) => {
    const result = await BodegasController.getById(Number(req.params.id));
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /bodegas/lotes/fefo:
 *   get:
 *     summary: Obtener lotes de materia prima por vencimiento (FEFO)
 *     tags: [Bodegas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bodega_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar lotes por ID de bodega
 *       - in: query
 *         name: materia_prima_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la materia prima (obligatorio)
 *     responses:
 *       200:
 *         description: Lista de lotes ordenados por vencimiento
 *       400:
 *         description: materia_prima_id es requerido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (BODEGUERO o ADMIN)
 *       500:
 *         description: Error al obtener lotes FEFO
 */
router.get('/lotes/fefo', authenticate, requireRole('BODEGUERO', 'ADMIN'), async (req, res) => {
    const bodegaId = req.query.bodega_id ? Number(req.query.bodega_id) : undefined;
    const materiaPrimaId = req.query.materia_prima_id ? Number(req.query.materia_prima_id) : undefined;
    const result = await BodegasController.getLotesFEFO(bodegaId, materiaPrimaId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /bodegas:
 *   post:
 *     summary: Crear una nueva bodega (solo ADMIN o BODEGUERO)
 *     tags: [Bodegas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id, bodega]
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               bodega:
 *                 type: string
 *                 example: Bodega Central
 *     responses:
 *       201:
 *         description: Bodega creada
 *       400:
 *         description: Datos inválidos (sucursal_id y bodega son requeridos)
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       500:
 *         description: Error al crear bodega
 */
router.post('/', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaBodega), async (req, res) => {
    const result = await BodegasController.create(req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /bodegas/{id}:
 *   patch:
 *     summary: Actualizar una bodega existente (solo ADMIN o BODEGUERO)
 *     tags: [Bodegas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la bodega a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               bodega:
 *                 type: string
 *                 example: Bodega Norte
 *     responses:
 *       200:
 *         description: Bodega actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o BODEGUERO)
 *       404:
 *         description: Bodega no encontrada
 *       500:
 *         description: Error al actualizar bodega
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'BODEGUERO'), validate(schemaBodegaUpdate), async (req, res) => {
    const result = await BodegasController.update(Number(req.params.id), req.body);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=bodegas.routes.js.map