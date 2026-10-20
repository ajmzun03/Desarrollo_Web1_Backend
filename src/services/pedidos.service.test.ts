import { describe, it, expect, vi } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => ({ db: {}, Tx: {} as never }));

import { calcularLineas } from './pedidos.service.js';
import { ErrorNegocio } from '../utils/errors.js';

const productos = [
  { id: 1, precio: '10.00', activo: true },
  { id: 2, precio: '5.50', activo: true },
  { id: 3, precio: '8.00', activo: false },
  { id: 4, precio: '0', activo: true },
];
const extras = [
  { id: 10, producto_id: 1, precio: '2.00', activo: true },
  { id: 11, producto_id: 2, precio: '1.00', activo: true },
  { id: 12, producto_id: 1, precio: '3.00', activo: false },
];

describe('pedidos.service.calcularLineas', () => {
  it('calcula el total desde los precios del servidor (en centavos)', () => {
    const { lineas, totalCents } = calcularLineas(
      [{ producto_id: 1, cantidad: 2 }, { producto_id: 2, cantidad: 1 }],
      productos,
      extras
    );
    expect(totalCents).toBe(2550);
    expect(lineas).toHaveLength(2);
    expect(lineas[0]).toMatchObject({ producto_id: 1, precio_cents: 1000 });
  });

  it('suma extras multiplicados por la cantidad del ítem', () => {
    const { totalCents, lineas } = calcularLineas(
      [{ producto_id: 1, cantidad: 2, extras: [{ producto_extra_id: 10, cantidad: 1 }] }],
      productos,
      extras
    );
    // 2 x 10.00 + 2 x 2.00
    expect(totalCents).toBe(2400);
    expect(lineas[0]!.extras[0]).toMatchObject({ producto_extra_id: 10, cantidad: 2, precio_cents: 200 });
  });

  it('rechaza un producto inexistente (nunca asume precio 0)', () => {
    expect(() => calcularLineas([{ producto_id: 999, cantidad: 1 }], productos, extras))
      .toThrow(ErrorNegocio);
  });

  it('rechaza un producto inactivo con 409', () => {
    try {
      calcularLineas([{ producto_id: 3, cantidad: 1 }], productos, extras);
      expect.unreachable();
    } catch (e) {
      expect((e as ErrorNegocio).status).toBe(409);
    }
  });

  it('rechaza un producto con precio 0', () => {
    expect(() => calcularLineas([{ producto_id: 4, cantidad: 1 }], productos, extras))
      .toThrow('precio válido');
  });

  it('rechaza un extra de otro producto', () => {
    expect(() =>
      calcularLineas([{ producto_id: 2, cantidad: 1, extras: [{ producto_extra_id: 10 }] }], productos, extras)
    ).toThrow('no pertenece');
  });

  it('rechaza un extra inactivo o inexistente', () => {
    expect(() =>
      calcularLineas([{ producto_id: 1, cantidad: 1, extras: [{ producto_extra_id: 12 }] }], productos, extras)
    ).toThrow('no está disponible');
    expect(() =>
      calcularLineas([{ producto_id: 1, cantidad: 1, extras: [{ producto_extra_id: 99 }] }], productos, extras)
    ).toThrow('no existe');
  });
});

describe('pedidos.service.calcularLineas — combos', () => {
  const combos = [
    { id: 1, precio: '50.00', activo: true, detalles: [{ producto_id: 1, cantidad: '1' }, { producto_id: 2, cantidad: '2' }] },
    { id: 2, precio: '30.00', activo: false, detalles: [{ producto_id: 1, cantidad: '1' }] },
    { id: 3, precio: '30.00', activo: true, detalles: [{ producto_id: 3, cantidad: '1' }] },
    { id: 4, precio: '30.00', activo: true, detalles: [] },
  ];

  it('cobra el precio del combo y lo expande en sus productos (para stock y despacho)', () => {
    const { lineas, totalCents } = calcularLineas([{ combo_id: 1, cantidad: 2 }], productos, extras, combos);
    expect(totalCents).toBe(10000); // 2 x 50.00, no la suma de productos
    expect(lineas.map(l => [l.producto_id, l.cantidad])).toEqual([[1, 2], [2, 4]]);
  });

  it('prorratea el precio del combo entre sus productos según su peso en el catálogo', () => {
    const { lineas } = calcularLineas([{ combo_id: 1, cantidad: 1 }], productos, extras, combos);
    // pesos: p1 = 10.00 x1 = 1000, p2 = 5.50 x2 = 1100 => 50.00 * 1000/2100 y 50.00 * 1100/2100
    expect(lineas[0]!.precio_cents).toBe(Math.round((5000 * 1000) / 2100 / 1));
    expect(lineas[1]!.precio_cents).toBe(Math.round((5000 * 1100) / 2100 / 2));
  });

  it('mezcla productos y combos en un mismo pedido', () => {
    const { totalCents, lineas } = calcularLineas(
      [{ producto_id: 1, cantidad: 1 }, { combo_id: 1, cantidad: 1 }], productos, extras, combos
    );
    expect(totalCents).toBe(1000 + 5000);
    expect(lineas).toHaveLength(3);
  });

  it('rechaza combo inexistente, inactivo, vacío o con un producto inactivo', () => {
    expect(() => calcularLineas([{ combo_id: 99, cantidad: 1 }], productos, extras, combos)).toThrow('no existe');
    expect(() => calcularLineas([{ combo_id: 2, cantidad: 1 }], productos, extras, combos)).toThrow('no está disponible');
    expect(() => calcularLineas([{ combo_id: 4, cantidad: 1 }], productos, extras, combos)).toThrow('no tiene productos');
    expect(() => calcularLineas([{ combo_id: 3, cantidad: 1 }], productos, extras, combos)).toThrow('del combo');
  });

  it('rechaza ítems ambiguos y extras sobre combos', () => {
    expect(() => calcularLineas([{ producto_id: 1, combo_id: 1, cantidad: 1 }], productos, extras, combos)).toThrow('no ambos');
    expect(() => calcularLineas([{ cantidad: 1 }], productos, extras, combos)).toThrow('requiere');
    expect(() => calcularLineas([{ combo_id: 1, cantidad: 1, extras: [{ producto_extra_id: 10 }] }], productos, extras, combos))
      .toThrow('no admiten extras');
  });
});
