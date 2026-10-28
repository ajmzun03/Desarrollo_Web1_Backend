import { Router, type Request, type Response } from 'express';
import { PedidosController } from '../controllers/pedidos.controller.js';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cache, invalidateTags } from '../middleware/cache.js';
import { schemaPedidoCreate, schemaPedidoEstado } from '../schemas/pedido.schema.js';
import { schemaIncidente } from '../schemas/inventario.schema.js';

const router: Router = Router();

// GET /pedidos — autenticado (cliente: solo los suyos; personal: todos, paginado con limit/offset/estado)
/**
 * @openapi
 * /pedidos:
 *   get:
 *     summary: Listar todos los pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  const result = await PedidosController.getAll(req.user!, { limit, offset, estado });
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /pedidos/listos — DESPACHADOR o ADMIN
/**
 * @openapi
 * /pedidos/listos:
 *   get:
 *     summary: Listar pedidos en estado LISTO (DESPACHADOR o ADMIN)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos listos para despacho
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/listos', authenticate, requireRole('DESPACHADOR', 'ADMIN'), cache('pedidos-listos', 5), async (_req: Request, res: Response) => {
  const result = await PedidosController.getListos();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /pedidos/:id — autenticado (un cliente solo ve los suyos)
/**
 * @openapi
 * /pedidos/{id}:
 *   get:
 *     summary: Obtener un pedido por ID con sus detalles
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado con sus detalles
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await PedidosController.getById(Number(req.params.id), req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /pedidos — cliente (para sí mismo) o ADMIN/CAJERO (con cliente_id)
/**
 * @openapi
 * /pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 description: Solo para personal (ADMIN/CAJERO). Un cliente final siempre crea pedidos para sí mismo
 *                 example: 1
 *               direccion_id:
 *                 type: integer
 *                 description: Obligatoria si tipo_entrega es DOMICILIO; debe ser una dirección del cliente
 *               sucursal_id:
 *                 type: integer
 *               metodo_pago:
 *                 type: string
 *                 enum: [EFECTIVO, TARJETA]
 *               tipo_entrega:
 *                 type: string
 *                 enum: [DOMICILIO, RECOGER]
 *                 description: Por defecto DOMICILIO si hay direccion_id, de lo contrario RECOGER
 *               observaciones:
 *                 type: string
 *                 example: Sin sal
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id:
 *                       type: integer
 *                       example: 3
 *                     cantidad:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Pedido creado con sus detalles
 *       400:
 *         description: Datos inválidos o producto inexistente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticate, validate(schemaPedidoCreate), async (req: AuthRequest, res: Response) => {
  const result = await PedidosController.create(req.body, req.user!);
  if (result.status < 300) await invalidateTags('pedidos-listos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/estado — solo ADMIN (cambio genérico de estado)
/**
 * @openapi
 * /pedidos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un pedido (solo ADMIN)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [CREADO, LISTO, ANULADO, EN_RUTA, ENTREGADO]
 *                 example: EN_RUTA
 *     responses:
 *       200:
 *         description: Estado del pedido actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/estado', authenticate, requireRole('ADMIN'), validate(schemaPedidoEstado), async (req: Request, res: Response) => {
  const result = await PedidosController.updateEstado(Number(req.params.id), req.body.estado);
  if (result.status < 300) await invalidateTags('pedidos-listos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/metodo-efectivo — el dueño del pedido pasa de tarjeta a efectivo si aún no pagó
/**
 * @openapi
 * /pedidos/{id}/metodo-efectivo:
 *   patch:
 *     summary: Cambiar un pedido con tarjeta sin pagar a efectivo contra entrega
 *     tags: [Pedidos]
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
 *         description: Pedido actualizado a pago en efectivo
 *       404:
 *         description: Pedido no encontrado
 *       409:
 *         description: El pedido ya está pagado, no es de tarjeta o ya avanzó
 */
router.patch('/:id/metodo-efectivo', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await PedidosController.cambiarAEfectivo(Number(req.params.id), req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/preparar — cocina empieza el pedido y se descuenta el stock de insumos
/**
 * @openapi
 * /pedidos/{id}/preparar:
 *   patch:
 *     summary: Iniciar la preparación de un pedido (descuenta insumos de alacena/bodega)
 *     tags: [Pedidos]
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
 *         description: Pedido EN_PREPARACION
 *       409:
 *         description: Sin pago confirmado, estado inválido o stock insuficiente
 */
router.patch('/:id/preparar', authenticate, requireRole('ADMIN', 'JEFE_COCINA', 'COCINERO'), async (req: Request, res: Response) => {
  const result = await PedidosController.preparar(Number(req.params.id));
  if (result.status < 300) await invalidateTags('pedidos-listos', 'ordenes-cola');
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/listo — cocina marca el pedido como LISTO para despachar
/**
 * @openapi
 * /pedidos/{id}/listo:
 *   patch:
 *     summary: Marcar el pedido como LISTO para despacho (cocina)
 *     tags: [Pedidos]
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
 *         description: Pedido LISTO
 *       409:
 *         description: Sin pago confirmado o transición inválida
 */
router.patch('/:id/listo', authenticate, requireRole('ADMIN', 'JEFE_COCINA', 'COCINERO'), async (req: Request, res: Response) => {
  const result = await PedidosController.listo(Number(req.params.id));
  if (result.status < 300) await invalidateTags('pedidos-listos', 'ordenes-cola');
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/confirmar — ADMIN o CAJERO
/**
 * @openapi
 * /pedidos/{id}/confirmar:
 *   patch:
 *     summary: Confirmar un pedido, lo pasa a estado LISTO (ADMIN o CAJERO)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido a confirmar
 *     responses:
 *       200:
 *         description: Pedido confirmado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o CAJERO)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/confirmar', authenticate, requireRole('ADMIN', 'CAJERO'), async (req: Request, res: Response) => {
  const result = await PedidosController.confirmar(Number(req.params.id));
  if (result.status < 300) await invalidateTags('pedidos-listos', 'ordenes-cola');
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /pedidos/:id/entregado — DESPACHADOR o REPARTIDOR
/**
 * @openapi
 * /pedidos/{id}/entregado:
 *   patch:
 *     summary: Marcar un pedido como ENTREGADO (DESPACHADOR o REPARTIDOR)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido a entregar
 *     responses:
 *       200:
 *         description: Pedido marcado como entregado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o REPARTIDOR)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/entregado', authenticate, requireRole('DESPACHADOR', 'REPARTIDOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const result = await PedidosController.marcarEntregado(Number(req.params.id), req.user!);
  if (result.status < 300) await invalidateTags('pedidos-listos');
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /pedidos/{id}/incidente:
 *   post:
 *     summary: Reporte de incidente/devolución del repartidor (RF-002 Repartidor)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo]
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: Cliente no se encontraba
 *               detalle:
 *                 type: string
 *                 example: Se reintentará mañana
 *     responses:
 *       200:
 *         description: Incidente registrado en el pedido
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene el rol requerido (REPARTIDOR o ADMIN)
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/incidente', authenticate, requireRole('REPARTIDOR', 'ADMIN'), validate(schemaIncidente), async (req: AuthRequest, res: Response) => {
  const { motivo, detalle } = req.body;
  const result = await PedidosController.incidente(Number(req.params.id), motivo, detalle, req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;