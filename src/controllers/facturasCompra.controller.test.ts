import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/facturaCompra.model.js', () => ({
  FacturaCompraModel: { getByOrdenCompraId: vi.fn() },
}));

import { FacturasCompraController } from './facturasCompra.controller.js';
import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';

const mockModel = vi.mocked(FacturaCompraModel, true);

describe('FacturasCompraController.getByOrdenCompraId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve [] cuando la OC no tiene facturas', async () => {
    mockModel.getByOrdenCompraId.mockResolvedValueOnce([] as never);
    const result = await FacturasCompraController.getByOrdenCompraId(9);
    expect(result.status).toBe(200);
    expect(result.data).toEqual([]);
  });

  it('devuelve las facturas de la OC', async () => {
    mockModel.getByOrdenCompraId.mockResolvedValueOnce([
      { id: 1, orden_compra_id: 9, total: '100' },
    ] as never);
    const result = await FacturasCompraController.getByOrdenCompraId(9);
    expect(result.status).toBe(200);
    expect(result.data).toHaveLength(1);
  });

  it('devuelve 500 si el model lanza', async () => {
    mockModel.getByOrdenCompraId.mockRejectedValueOnce(new Error('db down') as never);
    const result = await FacturasCompraController.getByOrdenCompraId(9);
    expect(result.status).toBe(500);
  });
});
