import type Stripe from 'stripe';
import { stripe, testTokenParaTarjeta } from '../config/stripe.js';
import logger from '../config/logger.js';

export const PagosController = {
  async createCheckout(data: { items: Array<{ nombre: string; cantidad: number; monto: number }> }) {
    try {
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'items es requerido', status: 400 };
      }

      const lineItems = data.items.map(item => ({
        price_data: {
          currency: 'gtq', // cambia a 'usd' si tu moneda es dólares
          product_data: { name: item.nombre },
          unit_amount: Math.round(item.monto * 100), // Stripe usa centavos
        },
        quantity: item.cantidad,
      }));

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        payment_method_types: ['card'],
        success_url: 'http://localhost:3000/pagos/success',
        cancel_url: 'http://localhost:3000/pagos/cancel',
      });

      return { data: { id: session.id, url: session.url }, error: null, status: 201 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error crear checkout');
      return { data: null, error: 'Error al crear el pago', status: 500 };
    }
  },

  async createPaymentIntent(data: {
    items: Array<{ nombre: string; cantidad: number; monto: number }>,
    payment_method?: string,
    tarjeta?: { number: string; exp_month: number; exp_year: number; cvc?: string },
    pedido_id?: number
  }) {
    try {
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { data: null, error: 'items es requerido', status: 400 };
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