import type Stripe from 'stripe';
import { stripe, testTokenParaTarjeta } from '../config/stripe.js';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, IS_PROD } from '../config.js';
import type { DecodedToken } from '../jwt.js';
import logger from '../config/logger.js';

/**
 * Verifica que el llamador sea un cliente autenticado y que el pedido exista
 * y le pertenezca. El monto siempre sale de pedido.total (servidor).
 */
async function verificarPedidoPropio(pedidoId: number, user: DecodedToken) {
  // Solo clientes: evita que un empleado con el mismo id numérico pague
  // el pedido de un cliente con id coincidente.
  if (user.tipo !== 'cliente') {
    return { error: { data: null, error: 'Solo clientes pueden pagar pedidos', status: 403 } as const };
  }
  const pedido = await PedidoModel.getPedidoId(pedidoId);
  if (!pedido) {
    return { error: { data: null, error: 'Pedido no encontrado', status: 404 } as const };
  }
  if (Number(pedido.cliente_id) !== Number(user.id)) {
    return { error: { data: null, error: 'El pedido no pertenece al usuario', status: 403 } as const };
  }
  return { pedido };
}

/** Convierte el total del pedido (numeric de Drizzle → string) a centavos enteros. */
function totalCentavosDelPedido(pedido: { total: unknown }): number {
  const total = Number(pedido.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('El total del pedido no es válido');
  }
  return Math.round(total * 100);
}

/**
 * Idempotencia por pedido: reintentar el mismo pedido devuelve el mismo
 * PaymentIntent (evita cobros dobles ante reintentos de red).
 */
function idempotencyKey(pedidoId: number): string {
  return `pagar-pedido:${pedidoId}`;
}

export const PagosController = {
  async createCheckout(data: { items: unknown[]; pedido_id: number }, user: DecodedToken) {
    try {
      const { error, pedido } = await verificarPedidoPropio(data.pedido_id, user);
      if (error) return { ...error };

      // El monto sale SIEMPRE del servidor; los montos del cliente se ignoran.
      const totalCentavos = totalCentavosDelPedido(pedido!);

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'gtq',
                product_data: { name: `Pedido #${data.pedido_id}` },
                unit_amount: totalCentavos,
              },
              quantity: 1,
            },
          ],
          payment_method_types: ['card'],
          success_url: STRIPE_SUCCESS_URL || 'http://localhost:3000/pagos/success',
          cancel_url: STRIPE_CANCEL_URL || 'http://localhost:3000/pagos/cancel',
          metadata: { pedido_id: String(data.pedido_id) },
        },
        { idempotencyKey: idempotencyKey(data.pedido_id) }
      );

      return {
        data: { id: session.id, url: session.url, total: Number(pedido!.total) },
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
      items: unknown[],
      payment_method?: string,
      tarjeta?: { number: string; exp_month: number; exp_year: number; cvc?: string },
      pedido_id: number
    },
    user: DecodedToken
  ) {
    try {
      const { error, pedido } = await verificarPedidoPropio(data.pedido_id, user);
      if (error) return { ...error };

      // El monto sale SIEMPRE del servidor; los montos del cliente se ignoran.
      const amount = totalCentavosDelPedido(pedido!);

      // La ruta de tarjeta cruda es solo para entornos de desarrollo/test.
      if (data.tarjeta && IS_PROD) {
        return {
          data: null,
          error: 'Datos de tarjeta crudos no permitidos en producción. Usa payment_method (Stripe Elements).',
          status: 400,
        };
      }

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

      // 2) Si no hay un payment_method válido, usa la tarjeta de prueba (solo dev)
      if (!paymentMethodId && data.tarjeta?.number && !IS_PROD) {
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

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: 'gtq',
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          metadata: { pedido_id: String(data.pedido_id) },
        },
        { idempotencyKey: idempotencyKey(data.pedido_id) }
      );

      return { data: { id: paymentIntent.id, status: paymentIntent.status }, error: null, status: 201 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error crear PaymentIntent');
      return { data: null, error: error.message, status: 500 };
    }
  },

  async getPaymentIntent(id: string, user: DecodedToken) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(id);
      const pedidoId = paymentIntent.metadata?.pedido_id;

      // Sin pedido asociado no se puede autorizar: no exponer el pago.
      if (!pedidoId) {
        return { data: null, error: 'Pago no encontrado', status: 404 };
      }

      const { error } = await verificarPedidoPropio(Number(pedidoId), user);
      if (error) return { ...error };

      return {
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          pedido_id: pedidoId,
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
