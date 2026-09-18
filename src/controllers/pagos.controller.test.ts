import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PagosController } from './pagos.controller.js';
import { stripe } from '../config/stripe.js';

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

const mockStripe = vi.mocked(stripe, true);

describe('PagosController.createPaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 400 si no hay items', async () => {
    const result = await PagosController.createPaymentIntent({ items: [] });
    expect(result.status).toBe(400);
    expect(result.error).toContain('items');
  });

  it('cae a tarjeta cuando el payment_method no existe en Stripe', async () => {
    vi.mocked(mockStripe.paymentMethods.retrieve).mockRejectedValueOnce(new Error('No such PaymentMethod'));
    vi.mocked(mockStripe.paymentMethods.create).mockResolvedValueOnce({ id: 'pm_creado' } as any);
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
      amount: 8800,
      currency: 'gtq',
      created: 123,
      metadata: {},
    } as any);

    const result = await PagosController.createPaymentIntent({
      items: [{ nombre: 'Hamburguesa', cantidad: 2, monto: 44 }],
      payment_method: 'pm_1...',
      tarjeta: { number: '4242424242424242', exp_month: 12, exp_year: 2027 },
    });

    expect(result.status).toBe(201);
    expect((result.data as any).status).toBe('succeeded');
    expect(mockStripe.paymentMethods.create).toHaveBeenCalledWith({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 8800, payment_method: 'pm_creado' })
    );
  });

  it('usa el payment_method si existe en Stripe', async () => {
    vi.mocked(mockStripe.paymentMethods.retrieve).mockResolvedValueOnce({ id: 'pm_good' } as any);
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_999',
      status: 'succeeded',
      amount: 1000,
      currency: 'gtq',
      created: 1,
      metadata: {},
    } as any);

    const result = await PagosController.createPaymentIntent({
      items: [{ nombre: 'Coca', cantidad: 1, monto: 10 }],
      payment_method: 'pm_good',
    });

    expect(result.status).toBe(201);
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method: 'pm_good', amount: 1000 })
    );
  });

  it('incluye pedido_id en metadata si se envía', async () => {
    vi.mocked(mockStripe.paymentMethods.retrieve).mockResolvedValueOnce({ id: 'pm_good' } as any);
    vi.mocked(mockStripe.paymentIntents.create).mockResolvedValueOnce({
      id: 'pi_888',
      status: 'succeeded',
      amount: 4400,
      currency: 'gtq',
      created: 1,
      metadata: { pedido_id: '7' },
    } as any);

    await PagosController.createPaymentIntent({
      items: [{ nombre: 'Hamburguesa', cantidad: 1, monto: 44 }],
      payment_method: 'pm_good',
      pedido_id: 7,
    });

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { pedido_id: '7' } })
    );
  });

  it('devuelve 400 si la tarjeta no es reconocida', async () => {
    const result = await PagosController.createPaymentIntent({
      items: [{ nombre: 'Test', cantidad: 1, monto: 10 }],
      tarjeta: { number: '9999999999999999', exp_month: 12, exp_year: 2027 },
    });

    expect(result.status).toBe(400);
  });
});