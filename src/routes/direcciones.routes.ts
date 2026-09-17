import { Router, type Request, type Response } from 'express';
import { DireccionesController } from '../controllers/direcciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaDireccion, schemaDireccionUpdate } from '../schemas/direccion.schema.js';

const router: Router = Router();

// GET /direcciones?cliente_id= — autenticado
/**
 * @openapi
 * /direcciones:
 *   get:
 *     summary: Listar direcciones (filtrable por cliente)
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cliente_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar direcciones por ID de cliente
 *     responses:
 *       200:
 *         description: Lista de direcciones
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const clienteId = req.query.cliente_id ? Number(req.query.cliente_id) : undefined;
  const result = await DireccionesController.getAll(clienteId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /direcciones/:id — autenticado
/**
 * @openapi
 * /direcciones/{id}:
 *   get:
 *     summary: Obtener una dirección por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dirección
 *     responses:
 *       200:
 *         description: Dirección encontrada
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await DireccionesController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /direcciones — solo ADMIN
/**
 * @openapi
 * /direcciones:
 *   post:
 *     summary: Crear una nueva dirección (solo ADMIN)
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliente_id, municipio_id, direccion1, direccion2]
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 example: 1
 *               municipio_id:
 *                 type: integer
 *                 example: 1
 *               direccion1:
 *                 type: string
 *                 example: Av. Principal 12-34
 *               direccion2:
 *                 type: string
 *                 example: Zona 4
 *     responses:
 *       201:
 *         description: Dirección creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(schemaDireccion), async (req: Request, res: Response) => {
  const result = await DireccionesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /direcciones/:id — solo ADMIN
/**
 * @openapi
 * /direcciones/{id}:
 *   patch:
 *     summary: Actualizar una dirección existente (solo ADMIN)
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dirección a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               municipio_id:
 *                 type: integer
 *               direccion1:
 *                 type: string
 *               direccion2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dirección actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(schemaDireccionUpdate), async (req: Request, res: Response) => {
  const result = await DireccionesController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;