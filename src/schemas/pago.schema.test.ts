import { describe, it, expect } from 'vitest';
import { schemaCheckout, schemaPagoCreate } from './pago.schema.js';

const items = [{ nombre: 'X', cantidad: 1, monto: 500 }];

describe('schemaCheckout', () => {
  it('exige pedido_id', () => {
    const r = schemaCheckout.safeParse({ items });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('pedido_id');
  });

  it('acepta pedido_id válido', () => {
    expect(schemaCheckout.safeParse({ items, pedido_id: 7 }).success).toBe(true);
  });

  it('rechaza campos desconocidos (strict)', () => {
    expect(schemaCheckout.safeParse({ items, pedido_id: 7, total: 1 }).success).toBe(false);
  });

  it('rechaza items con monto no positivo', () => {
    const malos = [{ nombre: 'X', cantidad: 1, monto: 0 }];
    expect(schemaCheckout.safeParse({ items: malos, pedido_id: 7 }).success).toBe(false);
  });
});

describe('schemaPagoCreate', () => {
  it('exige pedido_id', () => {
    const r = schemaPagoCreate.safeParse({ items, payment_method: 'pm_123' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('pedido_id');
  });

  it('acepta payment_method con pedido_id', () => {
    expect(schemaPagoCreate.safeParse({ items, payment_method: 'pm_123', pedido_id: 7 }).success).toBe(true);
  });

  it('acepta tarjeta con pedido_id', () => {
    const r = schemaPagoCreate.safeParse({
      items,
      tarjeta: { number: '4242424242424242', exp_month: 12, exp_year: 2027 },
      pedido_id: 7,
    });
    expect(r.success).toBe(true);
  });

  it('sigue exigiendo método de pago', () => {
    expect(schemaPagoCreate.safeParse({ items, pedido_id: 7 }).success).toBe(false);
  });
});
