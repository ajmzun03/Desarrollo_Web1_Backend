import { Router, type Request, type Response } from 'express';
import { ProductosExtraController } from '../controllers/productosExtra.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cache, invalidateTags } from '../middleware/cache.js';
import { schemaProductoExtraCreate, schemaProductoExtraUpdate } from '../schemas/productoExtra.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /productos-extra:
 *   get:
 *     summary: Listar todos los productos extra disponibles
 *     tags: [Productos Extra]
 *     responses:
 *       200:
 *         description: Lista de extras
 */
router.get('/', cache('productos-extra', 300), async (_req: Request, res: Response) => {
  const result = await ProductosExtraController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /productos-extra/producto/{productoId}:
 *   get:
 *     summary: Listar extras disponibles para un producto específico
 *     tags: [Productos Extra]
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de extras aplicables al producto
 */
router.get('/producto/:productoId', cache('productos-extra', 300), async (req: Request, res: Response) => {
  const result = await ProductosExtraController.getByProducto(Number(req.params.productoId));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /productos-extra/{id}:
 *   get:
 *     summary: Obtener un producto extra por ID
 *     tags: [Productos Extra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del extra
 *       404:
 *         description: Extra no encontrado
 */
router.get('/:id', cache('productos-extra', 300), async (req: Request, res: Response) => {
  const result = await ProductosExtraController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /productos-extra:
 *   post:
 *     summary: Crear un nuevo producto extra (solo ADMIN)
 *     tags: [Productos Extra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [producto_id, nombre, precio]
 *             properties:
 *               producto_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Queso extra
 *               precio:
 *                 type: number
 *                 example: 5.00
 *     responses:
 *       201:
 *         description: Extra creado exitosamente
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(schemaProductoExtraCreate),
  async (req: Request, res: Response) => {
    const result = await ProductosExtraController.create(req.body);
    if (result.status < 300) await invalidateTags('productos-extra');
    res.status(result.status).json({ data: result.data, error: result.error });
  }
);

/**
 * @openapi
 * /productos-extra/{id}:
 *   patch:
 *     summary: Actualizar un producto extra (solo ADMIN)
 *     tags: [Productos Extra]
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
 *         description: Extra actualizado
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(schemaProductoExtraUpdate),
  async (req: Request, res: Response) => {
    const result = await ProductosExtraController.update(Number(req.params.id), req.body);
    if (result.status < 300) await invalidateTags('productos-extra');
    res.status(result.status).json({ data: result.data, error: result.error });
  }
);

/**
 * @openapi
 * /productos-extra/{id}:
 *   delete:
 *     summary: Desactivar un producto extra (solo ADMIN)
 *     tags: [Productos Extra]
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
 *         description: Extra desactivado
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const result = await ProductosExtraController.delete(Number(req.params.id));
  if (result.status < 300) await invalidateTags('productos-extra');
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
