import { Router, type Request, type Response } from 'express';
import { PagosController } from '../controllers/pagos.controller.js';
import { validate } from '../middleware/validate.js';
import { schemaPagoCreate } from '../schemas/pago.schema.js';

const router: Router = Router();

/**
 * @openapi
 * /pagos/checkout:
 *   post:
 *     summary: Crear una sesión de pago Stripe
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
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
 *         description: items es requerido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/checkout', async (req: Request, res: Response) => {
  const result = await PagosController.createCheckout(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /pagos/payment-intent:
 *   post:
 *     summary: Cobrar con tarjeta directamente desde el backend (PaymentIntent)
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
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
 *                 description: Datos de tarjeta de prueba (solo test mode). Opcional si envias payment_method.
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
 *                 description: ID del pedido asociado al pago (se guarda como metadata en Stripe)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Pago procesado, devuelve el id y status del PaymentIntent
 *       400:
 *         description: items requeridos, o tarjeta/payment_method inválidos
 *       500:
 *         description: Error al procesar el pago
 */
router.post('/payment-intent', validate(schemaPagoCreate), async (req: Request, res: Response) => {
  const result = await PagosController.createPaymentIntent(req.body);
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
 *       404:
 *         description: PaymentIntent no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', async (req: Request, res: Response) => {
  const result = await PagosController.getPaymentIntent(String(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;