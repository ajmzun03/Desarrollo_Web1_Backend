import type Stripe from 'stripe';
import { stripe, testTokenParaTarjeta } from '../config/stripe.js';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL } from '../config.js';
import type { DecodedToken } from '../jwt.js';
import logger from '../config/logger.js';

/**
 * Verifica que el pedido exista y pertenezca al usuario autenticado (cliente).
 * Devuelve el pedido o un error de respuesta.
 */
async function verificarPedidoPropio(pedidoId: number, user: DecodedToken) {
  const pedido = await PedidoModel.getPedidoId(pedidoId);
  if (!pedido) {
    return { error: { data: null, error: 'Pedido no encontrado', status: 404 } as const };
  }
  // Solo el dueño del pedido (cliente) puede pagarlo
  if (Number(pedido.cliente_id) !== Number(user.id)) {
    return { error: { data: null, error: 'El pedido no pertenece al usuario', status: 403 } as const };
  }
  return { pedido };
}

export const PagosController = {
  async createCheckout(
    data: { items: Array<{ nombre: string; cantidad: number; monto: number }>; pedido_id?: number },
    user: DecodedToken
  ) {
    try {
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'items es requerido', status: 400 };
      }

      // Si se asocia un pedido, verificar ownership y usar el total del servidor
      let totalServidor: number | null = null;
      if (data.pedido_id) {
        const { error, pedido } = await verificarPedidoPropio(data.pedido_id, user);
        if (error) return { ...error };
        totalServidor = Number(pedido!.total);
      }

      const lineItems = data.items.map(item => ({
        price_data: {
          currency: 'gtq',
          product_data: { name: item.nombre },
          unit_amount: Math.round(item.monto * 100),
        },
        quantity: item.cantidad,
      }));

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        payment_method_types: ['card'],
        success_url: STRIPE_SUCCESS_URL || 'http://localhost:3000/pagos/success',
        cancel_url: STRIPE_CANCEL_URL || 'http://localhost:3000/pagos/cancel',
        ...(data.pedido_id ? { metadata: { pedido_id: String(data.pedido_id) } } : {}),
      });

      return {
        data: { id: session.id, url: session.url, total: totalServidor },
        error: null,
        status: 201
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error crear checkout');
      return { data: null, error: 'Error al crear el pago', status: 500 };
    }
  },

  async createPaymentIntent(
    data: {
      items: Array<{ nombre: string; cantidad: number; monto: number }>,
      payment_method?: string,
      tarjeta?: { number: string; exp_month: number; exp_year: number; cvc?: string },
      pedido_id?: number
    },
    user: DecodedToken
  ) {
    try {
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'items es requerido', status: 400 };
      }

      // Si se asocia un pedido, verificar ownership
      if (data.pedido_id) {
        const { error } = await verificarPedidoPropio(data.pedido_id, user);
        if (error) return { ...error };
      }

      const totalCentavos = data.items.reduce(
        (sum, item) => sum + Math.round(item.monto * 100) * item.cantidad,
        0
      );

      // 1) Si viene payment_method, verifica que exista en Stripe; si no, ignóralo
      let paymentMethodId: string | undefined = undefined;
      if (data.payment_method) {
        try {
          await stripe.paymentMethods.retrieve(data.payment_method);
          paymentMethodId = data.payment_method;
        } catch {
          paymentMethodId = undefined; // pm inválido o no existe → cae a tarjeta
        }
      }

      // 2) Si no hay un payment_method válido, usa la tarjeta de prueba
      if (!paymentMethodId && data.tarjeta?.number) {
        const token = testTokenParaTarjeta(data.tarjeta.number);
        if (!token) {
          return {
            data: null,
            error: 'Tarjeta no reconocida para pruebas. Usa una tarjeta de prueba de Stripe (4242424242424242, etc.) o envía un payment_method válido creado con Stripe Elements.',
            status: 400,
          };
        }
        const pm = await stripe.paymentMethods.create({ type: 'card', card: { token } });
        paymentMethodId = pm.id;
      }

      // 3) Si al final no hay método de pago, error claro
      if (!paymentMethodId) {
        return {
          data: null,
          error: 'payment_method no existe o no se envió una tarjeta válida',
          status: 400,
        };
      }

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalCentavos,
        currency: 'gtq',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      };
      if (data.pedido_id) {
        paymentIntentParams.metadata = { pedido_id: String(data.pedido_id) };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return { data: { id: paymentIntent.id, status: paymentIntent.status }, error: null, status: 201 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error crear PaymentIntent');
      return { data: null, error: error.message, status: 500 };
    }
  },

  async getPaymentIntent(id: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(id);
      return {
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          pedido_id: paymentIntent.metadata?.pedido_id ?? null,
        },
        error: null,
        status: 200,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error get PaymentIntent');
      return { data: null, error: 'PaymentIntent no encontrado', status: 404 };
    }
  }
};
