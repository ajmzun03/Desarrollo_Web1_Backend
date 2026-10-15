import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PagosController } from './pagos.controller.js';
import { stripe } from '../config/stripe.js';
import type { DecodedToken } from '../jwt.js';

vi.mock('../config/stripe.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/stripe.js')>();
  return {
    stripe: {
      checkout: { sessions: { create: vi.fn() } },
      paymentMethods: { retrieve: vi.fn(), create: vi.fn() },
      paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
    },
    testTokenParaTarjeta: actual.testTokenParaTarjeta,
  };
});

vi.mock('../model/supabase/pedido.model.js', () => ({
  PedidoModel: { getPedidoId: vi.fn() },
}));

// Control mutable de IS_PROD para alternar tarjeta-cruda dev/prod
let mockIsProd = false;
vi.mock('../config.js', () => ({
  get IS_PROD() { return mockIsProd; },
  STRIPE_SUCCESS_URL: 'https://ok.test',
  STRIPE_CANCEL_URL: 'https://cancel.test',
  STRIPE_SECRET_KEY: 'sk_test_dummy',
}));

import { PedidoModel } from '../model/supabase/pedido.model.js';

const mockStripe = vi.mocked(stripe, true);
const mockPedido = vi.mocked(PedidoModel, true);

const cliente: DecodedToken = { id: '10', rol: 'CLIENTE', tipo: 'cliente' } as DecodedToken;
// Empleado con id numérico idéntico al cliente 10 (colisión de ids)
const empleado: DecodedToken = { id: '10', rol: 'CAJERO' } as DecodedToken;

const pedidoPropio = { id: 7, cliente_id: 10, total: '500.00' } as never;
const itemsMentirosos = [{ nombre: 'X', cantidad: 1, monto: 1 }];

beforeEach(() => {
  vi.clearAllMocks();
  mockIsProd = false;
});

describe('PagosController — monto siempre del servidor', () => {
  it('checkout ignora el monto del cliente y cobra pedido.total', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);
    vi.mocked(mockStripe.checkout.sessions.create).mockResolvedValueOnce({
      id: 'cs_1', url: 'https://stripe.com/pay',
    } as any);

    const result = await PagosController.createCheckout(
      { items: itemsMentirosos, pedido_id: 7 },
      cliente
    );

    expect(result.status).toBe(201);
    expect((result.data as any).total).toBe(500);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [expect.objectContaining({
          price_data: expect.objectContaining({ unit_amount: 50000 }),
        })],
        metadata: { pedido_id: '7' },
      }),
      { idempotencyKey: 'pagar-pedido:7' }
    );
  });

  it('payment-intent ignora el monto del cliente y cobra pedido.total', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);
    vi.mocked(mockStripe.paymentMethods.retrieve).mockResolvedValueOnce({ id: 'pm_good' } as any);
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_1', status: 'succeeded', metadata: { pedido_id: '7' },
    } as any);

    const result = await PagosController.createPaymentIntent(
      { items: itemsMentirosos, payment_method: 'pm_good', pedido_id: 7 },
      cliente
    );

    expect(result.status).toBe(201);
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50000 }),
      { idempotencyKey: 'pagar-pedido:7' }
    );
  });

  it('un pedido de Q500 no se puede pagar Q1 (montos del cliente ignorados)', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce({ id: 7, cliente_id: 10, total: '500.00' } as never);
    vi.mocked(mockStripe.paymentMethods.retrieve).mockResolvedValueOnce({ id: 'pm_good' } as any);
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_1', status: 'succeeded', metadata: { pedido_id: '7' },
    } as any);

    await PagosController.createPaymentIntent(
      { items: [{ nombre: 'Truco', cantidad: 1, monto: 1 }], payment_method: 'pm_good', pedido_id: 7 },
      cliente
    );

    const llamada = vi.mocked(mockStripe.paymentIntents.create).mock.calls[0]![0] as any;
    expect(llamada.amount).not.toBe(100);
    expect(llamada.amount).toBe(50000);
  });
});

describe('PagosController — autorización', () => {
  it('rechaza 403 si el usuario no es cliente (colisión de id con empleado)', async () => {
    const r = await PagosController.createPaymentIntent(
      { items: itemsMentirosos, payment_method: 'pm_good', pedido_id: 7 },
      empleado
    );
    expect(r.status).toBe(403);
    expect(mockPedido.getPedidoId).not.toHaveBeenCalled();
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('rechaza 403 si el pedido pertenece a otro cliente', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce({ id: 7, cliente_id: 99, total: '500.00' } as never);
    const r = await PagosController.createPaymentIntent(
      { items: itemsMentirosos, payment_method: 'pm_good', pedido_id: 7 },
      cliente
    );
    expect(r.status).toBe(403);
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('devuelve 404 si el pedido no existe', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce(null);
    const r = await PagosController.createPaymentIntent(
      { items: itemsMentirosos, payment_method: 'pm_good', pedido_id: 404 },
      cliente
    );
    expect(r.status).toBe(404);
  });

  it('checkout rechaza 403 a un empleado', async () => {
    const r = await PagosController.createCheckout({ items: itemsMentirosos, pedido_id: 7 }, empleado);
    expect(r.status).toBe(403);
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe('PagosController.getPaymentIntent — ownership', () => {
  it('devuelve 404 si el pago no tiene pedido asociado', async () => {
    vi.mocked(mockStripe.paymentIntents.retrieve).mockResolvedValueOnce({
      id: 'pi_x', metadata: {},
    } as any);
    const r = await PagosController.getPaymentIntent('pi_x', cliente);
    expect(r.status).toBe(404);
  });

  it('devuelve 403 si el pedido del pago es de otro cliente', async () => {
    vi.mocked(mockStripe.paymentIntents.retrieve).mockResolvedValueOnce({
      id: 'pi_x', status: 'succeeded', amount: 50000, currency: 'gtq', created: 1,
      metadata: { pedido_id: '7' },
    } as any);
    mockPedido.getPedidoId.mockResolvedValueOnce({ id: 7, cliente_id: 99, total: '500.00' } as never);

    const r = await PagosController.getPaymentIntent('pi_x', cliente);
    expect(r.status).toBe(403);
  });

  it('devuelve 403 si un empleado intenta leer el pago', async () => {
    vi.mocked(mockStripe.paymentIntents.retrieve).mockResolvedValueOnce({
      id: 'pi_x', metadata: { pedido_id: '7' },
    } as any);
    const r = await PagosController.getPaymentIntent('pi_x', empleado);
    expect(r.status).toBe(403);
  });

  it('devuelve 200 si el pago pertenece al cliente', async () => {
    vi.mocked(mockStripe.paymentIntents.retrieve).mockResolvedValueOnce({
      id: 'pi_x', status: 'succeeded', amount: 50000, currency: 'gtq', created: 1,
      metadata: { pedido_id: '7' },
    } as any);
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);

    const r = await PagosController.getPaymentIntent('pi_x', cliente);
    expect(r.status).toBe(200);
    expect((r.data as any).amount).toBe(500);
  });
});

describe('PagosController — tarjeta cruda', () => {
  it('rechaza datos de tarjeta crudos en producción', async () => {
    mockIsProd = true;
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);
    const r = await PagosController.createPaymentIntent(
      {
        items: itemsMentirosos,
        tarjeta: { number: '4242424242424242', exp_month: 12, exp_year: 2027 },
        pedido_id: 7,
      },
      cliente
    );
    expect(r.status).toBe(400);
    expect((r.error as string).toLowerCase()).toContain('producción');
    expect(mockStripe.paymentMethods.create).not.toHaveBeenCalled();
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('permite tarjeta de prueba en desarrollo', async () => {
    mockIsProd = false;
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);
    vi.mocked(mockStripe.paymentMethods.create).mockResolvedValueOnce({ id: 'pm_creado' } as any);
    vi.mocked(mockStripe.paymentMethods.retrieve).mockRejectedValueOnce(new Error('no existe'));
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_123', status: 'succeeded', metadata: { pedido_id: '7' },
    } as any);

    const r = await PagosController.createPaymentIntent(
      {
        items: itemsMentirosos,
        tarjeta: { number: '4242424242424242', exp_month: 12, exp_year: 2027 },
        pedido_id: 7,
      },
      cliente
    );

    expect(r.status).toBe(201);
    expect(mockStripe.paymentMethods.create).toHaveBeenCalledWith({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50000, payment_method: 'pm_creado' }),
      { idempotencyKey: 'pagar-pedido:7' }
    );
  });

  it('devuelve 400 si la tarjeta de prueba no es reconocida', async () => {
    mockPedido.getPedidoId.mockResolvedValueOnce(pedidoPropio);
    const r = await PagosController.createPaymentIntent(
      {
        items: itemsMentirosos,
        tarjeta: { number: '9999999999999999', exp_month: 12, exp_year: 2027 },
        pedido_id: 7,
      },
      cliente
    );
    expect(r.status).toBe(400);
  });
});
