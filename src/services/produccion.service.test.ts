import { describe, it, expect, vi } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => ({ db: {}, Tx: {} as never }));

import { calcularConsumos } from './produccion.service.js';

describe('produccion.service.calcularConsumos', () => {
  const receta = [
    { materia_prima_id: 1, cantidad_necesaria: '2.00' },
    { materia_prima_id: 2, cantidad_necesaria: '0.50' },
  ];

  it('escala los ingredientes por producción / rendimiento de la receta', () => {
    // la receta rinde 10 unidades; se producen 30 => 3x
    expect(calcularConsumos(receta, 30, 10)).toEqual([
      { materia_prima_id: 1, cantidad: 6 },
      { materia_prima_id: 2, cantidad: 1.5 },
    ]);
  });

  it('con producción igual al rendimiento consume exactamente la receta', () => {
    expect(calcularConsumos(receta, 10, 10)).toEqual([
      { materia_prima_id: 1, cantidad: 2 },
      { materia_prima_id: 2, cantidad: 0.5 },
    ]);
  });

  it('descarta ingredientes que redondean a 0', () => {
    expect(calcularConsumos([{ materia_prima_id: 1, cantidad_necesaria: '0.01' }], 1, 1000)).toEqual([]);
  });

  it('rechaza rendimiento o producción inválidos (409)', () => {
    expect(() => calcularConsumos(receta, 10, 0)).toThrow('cantidad de lote');
    expect(() => calcularConsumos(receta, 0, 10)).toThrow('cantidad de producción');
  });
});
