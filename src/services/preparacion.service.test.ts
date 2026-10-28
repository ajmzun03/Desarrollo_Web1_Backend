import { describe, expect, it } from 'vitest';
import { consumosDelPedido } from './preparacion.service.js';

describe('consumosDelPedido', () => {
  it('escala la receta a lo pedido y suma la misma materia prima de varios productos', () => {
    const consumos = consumosDelPedido([
      { cantidad: 2, cantidad_lote: 1, ingredientes: [{ materia_prima_id: 1, cantidad_necesaria: '0.30' }, { materia_prima_id: 2, cantidad_necesaria: 1 }] },
      { cantidad: 3, cantidad_lote: 6, ingredientes: [{ materia_prima_id: 1, cantidad_necesaria: '1.00' }] }
    ]);
    expect(consumos.get(1)).toBe(1.1); // 2*0.30 + 3/6*1.00
    expect(consumos.get(2)).toBe(2);
  });

  it('sin recetas no consume nada', () => {
    expect(consumosDelPedido([]).size).toBe(0);
  });
});
