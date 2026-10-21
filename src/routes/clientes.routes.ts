import { Router, type Request, type Response } from 'express';
import { ClientesController } from '../controllers/clientes.controller.js';
import { authenticate, requireRole, propioORoles, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaCliente, schemaClienteUpdate } from '../schemas/cliente.schema.js';

const router: Router = Router();

// GET /clientes?telefono= — ADMIN, CAJERO, DESPACHADOR, GERENTE
/**
 * @openapi
 * /clientes:
 *   get:
 *     summary: Listar clientes (filtrable por teléfono)
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: telefono
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtrar por teléfono del cliente (8 dígitos)
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, requireRole('ADMIN', 'CAJERO', 'DESPACHADOR', 'GERENTE'), async (req: Request, res: Response) => {
  const telefono = req.query.telefono as string | undefined;
  const result = await ClientesController.getAll(telefono);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /clientes/:id — el propio cliente o personal autorizado
/**
 * @openapi
 * /clientes/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, propioORoles('id', 'ADMIN', 'CAJERO', 'DESPACHADOR', 'GERENTE', 'REPARTIDOR'), async (req: AuthRequest, res: Response) => {
  const result = await ClientesController.getById(Number(req.params.id), req.user);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /clientes — ADMIN o CAJERO (alta en mostrador)
/**
 * @openapi
 * /clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, telefono, telefono_ref]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 example: Pérez
 *               telefono:
 *                 type: string
 *                 description: Exactamente 8 dígitos
 *                 example: "12345678"
 *               telefono_ref:
 *                 type: string
 *                 description: Exactamente 8 dígitos, diferente al teléfono principal
 *                 example: "87654321"
 *     responses:
 *       201:
 *         description: Cliente creado
 *       400:
 *         description: Datos inválidos o teléfono ya registrado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, requireRole('ADMIN', 'CAJERO'), validate(schemaCliente), async (req: Request, res: Response) => {
  const result = await ClientesController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /clientes/:id — el propio cliente, ADMIN o CAJERO
/**
 * @openapi
 * /clientes/{id}:
 *   patch:
 *     summary: Actualizar un cliente existente
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Carlos
 *               apellido:
 *                 type: string
 *                 example: Pérez
 *               telefono:
 *                 type: string
 *                 example: "12345678"
 *               telefono_ref:
 *                 type: string
 *                 example: "87654321"
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authenticate, propioORoles('id', 'ADMIN', 'CAJERO'), validate(schemaClienteUpdate), async (req: Request, res: Response) => {
  const result = await ClientesController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;