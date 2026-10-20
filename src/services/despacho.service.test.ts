import { describe, it, expect, vi } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => ({ db: {}, Tx: {} as never }));

import { validarItemsDespacho, type LoteDespacho } from './despacho.service.js';

const lotes = new Map<number, LoteDespacho>([
  [1, { id: 1, producto_id: 10, cantidad_actual: 5, estado: 'VIGENTE' }],
  [2, { id: 2, producto_id: 20, cantidad_actual: 3, estado: 'VIGENTE' }],
  [3, { id: 3, producto_id: 10, cantidad_actual: 9, estado: 'VENCIDO' }],
  [4, { id: 4, producto_id: 99, cantidad_actual: 9, estado: 'VIGENTE' }],
]);
const pedido = [{ producto_id: 10, cantidad: 4 }, { producto_id: 20, cantidad: 2 }];
const nada = new Map<number, number>();

describe('despacho.service.validarItemsDespacho', () => {
  it('acepta un despacho completo y válido', () => {
    expect(() => validarItemsDespacho(
      [{ producto_lote_id: 1, cantidad_despachada: 4 }, { producto_lote_id: 2, cantidad_despachada: 2 }],
      lotes, pedido, nada
    )).not.toThrow();
  });

  it('rechaza un lote inexistente (404)', () => {
    expect(() => validarItemsDespacho([{ producto_lote_id: 77, cantidad_despachada: 1 }], lotes, pedido, nada))
      .toThrow('no existe');
  });

  it('rechaza un lote vencido o agotado (409)', () => {
    expect(() => validarItemsDespacho([{ producto_lote_id: 3, cantidad_despachada: 1 }], lotes, pedido, nada))
      .toThrow('VENCIDO');
  });

  it('rechaza un producto que no está en el pedido', () => {
    expect(() => validarItemsDespacho([{ producto_lote_id: 4, cantidad_despachada: 1 }], lotes, pedido, nada))
      .toThrow('no está en el pedido');
  });

  it('rechaza si el lote no alcanza, sumando ítems repetidos del mismo lote', () => {
    expect(() => validarItemsDespacho(
      [{ producto_lote_id: 2, cantidad_despachada: 2 }, { producto_lote_id: 2, cantidad_despachada: 2 }],
      lotes, pedido, nada
    )).toThrow('solo tiene 3');
  });

  it('rechaza despachar más de lo pedido', () => {
    expect(() => validarItemsDespacho([{ producto_lote_id: 1, cantidad_despachada: 5 }], lotes, pedido, nada))
      .toThrow('solo tiene 4');
  });

  it('cuenta lo ya despachado en hojas anteriores del pedido', () => {
    expect(() => validarItemsDespacho(
      [{ producto_lote_id: 1, cantidad_despachada: 2 }],
      lotes, pedido, new Map([[10, 3]])
    )).toThrow('solo tiene 4');
    expect(() => validarItemsDespacho(
      [{ producto_lote_id: 1, cantidad_despachada: 1 }],
      lotes, pedido, new Map([[10, 3]])
    )).not.toThrow();
  });
});
