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
vi.mock('../model/supabase/stockBodega.model.js', () => ({
  StockBodegaModel: { create: vi.fn() },
}));
vi.mock('./recepcion.repo.js', () => ({
  cargarBodega: vi.fn(),
  cargarOrdenConDetalles: vi.fn(),
  finalizarOrden: vi.fn(),
}));

import { crearHojaRecepcion } from './recepcion.service.js';
import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { cargarBodega, cargarOrdenConDetalles, finalizarOrden } from './recepcion.repo.js';

const mockHoja = vi.mocked(HojaRecepcionModel, true);
const mockDetalle = vi.mocked(HojaRecepcionDetalleModel, true);
const mockLote = vi.mocked(LoteMateriaPrimaModel, true);
const mockKardex = vi.mocked(KardexBodegaModel, true);
const mockStock = vi.mocked(StockBodegaModel, true);
const mockBodega = vi.mocked(cargarBodega);
const mockOrden = vi.mocked(cargarOrdenConDetalles);
const mockFinalizar = vi.mocked(finalizarOrden);

const base = { sucursal_receptora: 2, bodega_id: 5 };
const unItem = [{ materia_prima_id: 1, cantidad_recibida: 10, fecha_vencimiento: '2027-01-01' }];

describe('recepcion.service.crearHojaRecepcion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockBodega.mockResolvedValue({ id: 5, sucursal_id: 2, bodega: 'B1' } as never);
  });

  it('crea hoja, detalle, lote, stock en bodega y kardex por cada item', async () => {
    mockHoja.create.mockResolvedValueOnce({ id: 30, tipo_recepcion: 'TOTAL' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockLote.create.mockResolvedValueOnce({ id: 100 } as never);
    mockKardex.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByHojaRecepcionId.mockResolvedValueOnce([{ hoja_recepcion_id: 30 }] as never);

    const result = await crearHojaRecepcion({ ...base, items: unItem });

    expect(mockHoja.create).toHaveBeenCalledWith(
      expect.objectContaining({ sucursal_receptora: 2, tipo_recepcion: 'TOTAL' }),
      expect.anything()
    );
    expect(mockDetalle.create).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad_recibida: '10', saldo: '10', estado: 'COMPLETA' }),
      expect.anything()
    );
    // el lote queda en la bodega (antes quedaba huérfano y no se podía trasladar)
    expect(mockStock.create).toHaveBeenCalledWith({ bodega_id: 5, lote_id: 100 }, expect.anything());
    // el kardex usa el id de la BODEGA, no el de la sucursal
    expect(mockKardex.create).toHaveBeenCalledWith(
      expect.objectContaining({ bodega_id: 5, lote_id: 100, tipo_movimiento: 'INGRESO' }),
      expect.anything()
    );
    expect(result.detalles).toHaveLength(1);
  });

  it('descuenta la merma del saldo', async () => {
    mockHoja.create.mockResolvedValueOnce({ id: 31, tipo_recepcion: 'PARCIAL' } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockLote.create.mockResolvedValueOnce({ id: 101 } as never);
    mockDetalle.getByHojaRecepcionId.mockResolvedValueOnce([] as never);

    await crearHojaRecepcion({
      ...base,
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

  it('no crea lote ni stock si todo fue merma', async () => {
    mockHoja.create.mockResolvedValueOnce({ id: 32 } as never);
    mockDetalle.create.mockResolvedValueOnce({} as never);
    mockDetalle.getByHojaRecepcionId.mockResolvedValueOnce([] as never);

    await crearHojaRecepcion({
      ...base,
      items: [{ materia_prima_id: 1, cantidad_recibida: 4, fecha_vencimiento: '2027-01-01', merma: 4 }],
    });

    expect(mockDetalle.create).toHaveBeenCalledWith(expect.objectContaining({ estado: 'INCOMPLETA' }), expect.anything());
    expect(mockLote.create).not.toHaveBeenCalled();
    expect(mockStock.create).not.toHaveBeenCalled();
  });

  it('rechaza una merma mayor a lo recibido', async () => {
    await expect(crearHojaRecepcion({
      ...base,
      items: [{ materia_prima_id: 1, cantidad_recibida: 2, fecha_vencimiento: '2027-01-01', merma: 3 }],
    })).rejects.toThrow('merma');
    expect(mockHoja.create).not.toHaveBeenCalled();
  });

  it('rechaza si la bodega no existe o es de otra sucursal', async () => {
    mockBodega.mockResolvedValueOnce(null);
    await expect(crearHojaRecepcion({ ...base, items: unItem })).rejects.toThrow('Bodega no encontrada');

    mockBodega.mockResolvedValueOnce({ id: 5, sucursal_id: 9 } as never);
    await expect(crearHojaRecepcion({ ...base, items: unItem })).rejects.toThrow('no pertenece a la sucursal');
  });

  describe('con orden de compra', () => {
    it('rechaza una orden que no está agendada (EN_PREPARACION)', async () => {
      mockOrden.mockResolvedValueOnce({ orden: { estado_orden: 'CREADA', sucursal_destino: 2 }, detalles: [] } as never);
      await expect(crearHojaRecepcion({ ...base, orden_compra_id: 8, items: unItem })).rejects.toThrow('EN_PREPARACION');
    });

    it('rechaza una orden de otra sucursal', async () => {
      mockOrden.mockResolvedValueOnce({
        orden: { estado_orden: 'EN_PREPARACION', sucursal_destino: 7 },
        detalles: [{ materia_prima_id: 1 }],
      } as never);
      await expect(crearHojaRecepcion({ ...base, orden_compra_id: 8, items: unItem })).rejects.toThrow('otra sucursal');
    });

    it('rechaza materia prima que no está en la orden', async () => {
      mockOrden.mockResolvedValueOnce({
        orden: { estado_orden: 'EN_PREPARACION', sucursal_destino: 2 },
        detalles: [{ materia_prima_id: 99 }],
      } as never);
      await expect(crearHojaRecepcion({ ...base, orden_compra_id: 8, items: unItem })).rejects.toThrow('no está en la orden');
    });

    it('una recepción TOTAL finaliza la orden de compra; una PARCIAL no', async () => {
      const ctx = {
        orden: { estado_orden: 'EN_PREPARACION', sucursal_destino: 2 },
        detalles: [{ materia_prima_id: 1 }],
      } as never;
      mockHoja.create.mockResolvedValue({ id: 40 } as never);
      mockDetalle.create.mockResolvedValue({} as never);
      mockLote.create.mockResolvedValue({ id: 200 } as never);
      mockDetalle.getByHojaRecepcionId.mockResolvedValue([] as never);

      mockOrden.mockResolvedValueOnce(ctx);
      await crearHojaRecepcion({ ...base, orden_compra_id: 8, tipo_recepcion: 'TOTAL', items: unItem });
      expect(mockFinalizar).toHaveBeenCalledWith(expect.anything(), 8);

      mockFinalizar.mockClear();
      mockOrden.mockResolvedValueOnce(ctx);
      await crearHojaRecepcion({ ...base, orden_compra_id: 8, tipo_recepcion: 'PARCIAL', items: unItem });
      expect(mockFinalizar).not.toHaveBeenCalled();
    });
  });
});
