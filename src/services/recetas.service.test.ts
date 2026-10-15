import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => {
  const tx = {};
  return {
    db: { transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)) },
    Tx: {} as never,
  };
});

vi.mock('../model/supabase/receta.model.js', () => ({
  RecetaModel: { create: vi.fn() },
  RecetaDetalleModel: { create: vi.fn(), getByRecetaId: vi.fn() },
}));

import { crearReceta } from './recetas.service.js';
import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';

const mockReceta = vi.mocked(RecetaModel, true);
const mockDetalle = vi.mocked(RecetaDetalleModel, true);

describe('recetas.service.crearReceta', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea receta con detalles', async () => {
    mockReceta.create.mockResolvedValueOnce({ id: 8, nombre: 'Hamburguesa' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByRecetaId.mockResolvedValueOnce([
      { receta_id: 8, materia_prima_id: 3, cantidad_necesaria: '0.5' },
    ] as never);

    const result = await crearReceta({
      producto_id: 1,
      nombre: 'Hamburguesa',
      cantidad_lote: 10,
      items: [{ materia_prima_id: 3, cantidad_necesaria: 0.5 }],
    });

    expect(mockReceta.create).toHaveBeenCalledWith(
      expect.objectContaining({ producto_id: 1, nombre: 'Hamburguesa', cantidad_lote: '10' }),
      expect.anything()
    );
    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ receta_id: 8, cantidad_necesaria: '0.5' }),
      expect.anything()
    );
    expect(result.detalles).toHaveLength(1);
  });

  it('crea receta sin detalles cuando no hay items', async () => {
    mockReceta.create.mockResolvedValueOnce({ id: 9, nombre: 'Sopa' } as never);
    mockDetalle.getByRecetaId.mockResolvedValueOnce([] as never);

    const result = await crearReceta({ producto_id: 2, nombre: 'Sopa', cantidad_lote: 5 });

    expect(mockDetalle.create).not.toHaveBeenCalled();
    expect(result.detalles).toHaveLength(0);
  });
});
