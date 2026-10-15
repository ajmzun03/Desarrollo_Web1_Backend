import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => {
  const tx = {};
  return {
    db: { transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)) },
    Tx: {} as never,
  };
});

vi.mock('../model/supabase/hojaRecepcion.model.js', () => ({
  HojaRecepcionModel: { create: vi.fn() },
  HojaRecepcionDetalleModel: { create: vi.fn(), getByHojaRecepcionId: vi.fn() },
}));
vi.mock('../model/supabase/loteMateriaPrima.model.js', () => ({
  LoteMateriaPrimaModel: { create: vi.fn() },
}));
vi.mock('../model/supabase/kardexBodega.model.js', () => ({
  KardexBodegaModel: { create: vi.fn() },
}));

import { crearHojaRecepcion } from './recepcion.service.js';
import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';

const mockHoja = vi.mocked(HojaRecepcionModel, true);
const mockDetalle = vi.mocked(HojaRecepcionDetalleModel, true);
const mockLote = vi.mocked(LoteMateriaPrimaModel, true);
const mockKardex = vi.mocked(KardexBodegaModel, true);

describe('recepcion.service.crearHojaRecepcion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea hoja, detalle, lote y kardex por cada item', async () => {
    mockHoja.create.mockResolvedValueOnce({ id: 30, tipo_recepcion: 'TOTAL' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockLote.create.mockResolvedValueOnce({ id: 100 } as never);
    mockKardex.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByHojaRecepcionId.mockResolvedValueOnce([
      { hoja_recepcion_id: 30, materia_prima_id: 1, cantidad_recibida: '10', merma: '0', saldo: '10', estado: 'COMPLETA' },
    ] as never);

    const result = await crearHojaRecepcion({
      sucursal_receptora: 2,
      items: [{ materia_prima_id: 1, cantidad_recibida: 10, fecha_vencimiento: '2027-01-01' }],
    });

    expect(mockHoja.create).toHaveBeenCalledWith(
      expect.objectContaining({ sucursal_receptora: 2, tipo_recepcion: 'TOTAL' }),
      expect.anything()
    );
    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad_recibida: '10', saldo: '10', estado: 'COMPLETA' }),
      expect.anything()
    );
    expect(mockKardex.create).toHaveBeenCalledTimes(1);
    expect(result.detalles).toHaveLength(1);
  });

  it('descuenta la merma del saldo', async () => {
    mockHoja.create.mockResolvedValueOnce({ id: 31, tipo_recepcion: 'PARCIAL' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockLote.create.mockResolvedValueOnce({ id: 101 } as never);
    mockKardex.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByHojaRecepcionId.mockResolvedValueOnce([] as never);

    await crearHojaRecepcion({
      sucursal_receptora: 2,
      tipo_recepcion: 'PARCIAL',
      items: [{ materia_prima_id: 1, cantidad_recibida: 10, fecha_vencimiento: '2027-01-01', merma: 2 }],
    });

    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ merma: '2', saldo: '8', estado: 'COMPLETA' }),
      expect.anything()
    );
    expect(mockLote.create).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad_inicial: '8', cantidad_actual: '8' }),
      expect.anything()
    );
  });
});
