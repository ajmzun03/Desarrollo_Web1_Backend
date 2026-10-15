import { Router, type Request, type Response } from 'express';
import { PagosController } from '../controllers/pagos.controller.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaPagoCreate, schemaCheckout } from '../schemas/pago.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /pagos/checkout:
 *   post:
 *     summary: Crear una sesión de pago Stripe (monto tomado del pedido en el servidor)
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, pedido_id]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [nombre, cantidad, monto]
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: Hamburguesa doble
 *                     cantidad:
 *                       type: integer
 *                       example: 2
 *                     monto:
 *                       type: number
 *                       example: 45.5
 *     responses:
 *       201:
 *         description: Sesión creada, devuelve la URL de pago
 *       400:
 *         description: items es requerido o inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: El pedido no pertenece al usuario
 *       500:
 *         description: Error interno del servidor
 */
router.post('/checkout', authenticate, validate(schemaCheckout), async (req: AuthRequest, res: Response) => {
  const result = await PagosController.createCheckout(req.body, req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /pagos/payment-intent:
 *   post:
 *     summary: Cobrar con tarjeta directamente desde el backend (monto tomado del pedido)
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, pedido_id]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [nombre, cantidad, monto]
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: Hamburguesa doble
 *                     cantidad:
 *                       type: integer
 *                       example: 2
 *                     monto:
 *                       type: number
 *                       example: 45.5
 *               payment_method:
 *                 type: string
 *                 description: ID creado con Stripe Elements (recomendado en producción). Opcional si envias tarjeta.
 *                 example: pm_1...
 *               tarjeta:
 *                 type: object
 *                 description: Datos de tarjeta de prueba (SOLO desarrollo/test; rechazado en producción). Opcional si envias payment_method.
 *                 properties:
 *                   number:
 *                     type: string
 *                     example: "4242424242424242"
 *                   exp_month:
 *                     type: integer
 *                     example: 12
 *                   exp_year:
 *                     type: integer
 *                     example: 2027
 *                   cvc:
 *                     type: string
 *                     example: "314"
 *               pedido_id:
 *                 type: integer
 *                 required: true
 *                 description: ID del pedido a pagar. El monto cobrado es pedido.total (servidor); los montos de items se ignoran.
 *                 example: 1
 *     responses:
 *       201:
 *         description: Pago procesado, devuelve el id y status del PaymentIntent
 *       400:
 *         description: items requeridos, o tarjeta/payment_method inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: El pedido no pertenece al usuario
 *       500:
 *         description: Error al procesar el pago
 */
router.post('/payment-intent', authenticate, validate(schemaPagoCreate), async (req: AuthRequest, res: Response) => {
  const result = await PagosController.createPaymentIntent(req.body, req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /pagos/{id}:
 *   get:
 *     summary: Obtener el estado de un PaymentIntent
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del PaymentIntent (pi_...)
 *     responses:
 *       200:
 *         description: Estado del pago
 *       401:
 *         description: No autenticado
 *       403:
 *         description: El pago no pertenece al usuario
 *       404:
 *         description: PaymentIntent no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await PagosController.getPaymentIntent(String(req.params.id), req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;