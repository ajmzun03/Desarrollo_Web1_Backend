import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => {
  const tx = {};
  return {
    db: { transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)) },
    Tx: {} as never,
  };
});

vi.mock('../model/supabase/ordenCompra.model.js', () => ({
  OrdenCompraModel: { create: vi.fn() },
  DetalleOrdenCompraModel: { create: vi.fn(), getByOrdenCompraId: vi.fn() },
}));

import { crearOrdenCompra } from './ordenesCompra.service.js';
import { OrdenCompraModel, DetalleOrdenCompraModel } from '../model/supabase/ordenCompra.model.js';

const mockOrden = vi.mocked(OrdenCompraModel, true);
const mockDetalle = vi.mocked(DetalleOrdenCompraModel, true);

describe('ordenesCompra.service.crearOrdenCompra', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea orden y detalles con subtotal calculado', async () => {
    mockOrden.create.mockResolvedValueOnce({ id: 12, estado_orden: 'CREADA' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByOrdenCompraId.mockResolvedValueOnce([
      { orden_compra_id: 12, materia_prima_id: 1, cantidad_solicitada: '10', precio_unitario: '3', subtotal: '30' },
    ] as never);

    const result = await crearOrdenCompra({
      proveedor_id: 4,
      sucursal_destino: 2,
      items: [{ materia_prima_id: 1, cantidad_solicitada: 10, precio_unitario: 3 }],
    });

    expect(mockOrden.create).toHaveBeenCalledWith(
      expect.objectContaining({ proveedor_id: 4, sucursal_destino: 2, estado_orden: 'CREADA' }),
      expect.anything()
    );
    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad_solicitada: '10', precio_unitario: '3', subtotal: '30' }),
      expect.anything()
    );
    expect(result.detalles).toHaveLength(1);
  });
});
