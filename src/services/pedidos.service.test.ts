import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => {
  const tx = {};
  return {
    db: { transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)) },
    Tx: {} as never,
  };
});

vi.mock('../model/supabase/pedido.model.js', () => ({
  PedidoModel: { createPedido: vi.fn() },
}));
vi.mock('../model/supabase/detallePedido.model.js', () => ({
  DetallePedidoModel: { create: vi.fn(), getByPedidoId: vi.fn() },
}));
vi.mock('../model/supabase/producto.model.js', () => ({
  ProductoModel: { getById: vi.fn() },
}));

import { crearPedido } from './pedidos.service.js';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
import { ProductoModel } from '../model/supabase/producto.model.js';

const mockPedido = vi.mocked(PedidoModel, true);
const mockDetalle = vi.mocked(DetallePedidoModel, true);
const mockProducto = vi.mocked(ProductoModel, true);

describe('pedidos.service.crearPedido', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea pedido y detalles calculando total desde precios', async () => {
    mockProducto.getById
      .mockResolvedValueOnce({ id: 1, precio: '10' } as never)
      .mockResolvedValueOnce({ id: 2, precio: '5' } as never);
    mockPedido.createPedido.mockResolvedValueOnce({ id: 77, total: '25', estado: 'CREADO' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByPedidoId.mockResolvedValueOnce([
      { pedido_id: 77, producto_id: 1, precio_unitario: '10', cantidad: '2' },
      { pedido_id: 77, producto_id: 2, precio_unitario: '5', cantidad: '1' },
    ] as never);

    const result = await crearPedido({
      cliente_id: 5,
      items: [
        { producto_id: 1, cantidad: 2 },
        { producto_id: 2, cantidad: 1 },
      ],
    });

    expect(result.total).toBe('25');
    expect(mockPedido.createPedido).toHaveBeenCalledWith(
      expect.objectContaining({ cliente_id: 5, total: '25', estado: 'CREADO' }),
      expect.anything()
    );
    expect(mockDetalle.create).toHaveBeenCalledTimes(2);
    expect(result.detalles).toHaveLength(2);
  });

  it('usa precio 0 cuando el producto no existe', async () => {
    mockProducto.getById.mockRejectedValueOnce(new Error('not found') as never);
    mockPedido.createPedido.mockResolvedValueOnce({ id: 78, total: '0', estado: 'CREADO' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByPedidoId.mockResolvedValueOnce([] as never);

    const result = await crearPedido({ cliente_id: 1, items: [{ producto_id: 999, cantidad: 3 }] });

    expect(result.total).toBe('0');
    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ precio_unitario: '0' }),
      expect.anything()
    );
  });
});
