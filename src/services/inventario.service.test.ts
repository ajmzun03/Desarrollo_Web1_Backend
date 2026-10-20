import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => {
  const tx = {};
  return {
    db: {
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
    },
    Tx: {} as never,
  };
});

vi.mock('../model/supabase/loteMateriaPrima.model.js', () => ({
  LoteMateriaPrimaModel: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../model/supabase/stockBodega.model.js', () => ({
  StockBodegaModel: {
    getByBodegaAndLote: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock('../model/supabase/kardexBodega.model.js', () => ({
  KardexBodegaModel: { create: vi.fn() },
}));
vi.mock('../model/supabase/gastosSucursal.model.js', () => ({
  GastosSucursalModel: { create: vi.fn() },
}));

import { traslado, ingresoVale, cuadre, planificarConsumo } from './inventario.service.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';

const mockLote = vi.mocked(LoteMateriaPrimaModel, true);
const mockStock = vi.mocked(StockBodegaModel, true);
const mockKardex = vi.mocked(KardexBodegaModel, true);
const mockGastos = vi.mocked(GastosSucursalModel, true);

describe('inventario.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('traslado', () => {
    it('rechaza cuando origen y destino son la misma bodega', async () => {
      await expect(
        traslado({ bodega_origen_id: 1, bodega_destino_id: 1, lote_id: 10, cantidad: 5 })
      ).rejects.toThrow('diferentes');
    });

    it('rechaza cuando el lote no está en la bodega de origen', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce(null as never);
      await expect(
        traslado({ bodega_origen_id: 1, bodega_destino_id: 2, lote_id: 10, cantidad: 5 })
      ).rejects.toThrow('no se encuentra');
    });

    it('rechaza cuando la cantidad supera el disponible', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce({ bodega_id: 1, lote_id: 10 } as never);
      mockLote.getById.mockResolvedValueOnce({ id: 10, cantidad_actual: '3', estado: 'VIGENTE' } as never);
      await expect(
        traslado({ bodega_origen_id: 1, bodega_destino_id: 2, lote_id: 10, cantidad: 99 })
      ).rejects.toThrow('mayor al disponible');
    });

    it('traslada y registra kardex cuando hay stock suficiente', async () => {
      mockStock.getByBodegaAndLote
        .mockResolvedValueOnce({ bodega_id: 1, lote_id: 10 } as never)
        .mockResolvedValueOnce(null as never);
      mockLote.getById.mockResolvedValueOnce({
        id: 10, materia_prima_id: 7, fecha_vencimiento: '2027-01-01',
        cantidad_actual: '10', estado: 'VIGENTE',
      } as never);
      mockLote.update.mockResolvedValueOnce({} as never);
      mockLote.create.mockResolvedValueOnce({ id: 99 } as never);
      mockStock.create.mockResolvedValueOnce({} as never);
      mockKardex.create.mockResolvedValueOnce({} as never);

      const result = await traslado({ bodega_origen_id: 1, bodega_destino_id: 2, lote_id: 10, cantidad: 4 });

      expect(result.saldo_origen).toBe(6);
      expect(result.lote_destino_id).toBe(99);
      expect(mockKardex.create).toHaveBeenCalledTimes(2);
      expect(mockLote.update).toHaveBeenCalledWith(10, expect.objectContaining({ cantidad_actual: '6' }), expect.anything());
    });
  });

  describe('ingresoVale', () => {
    it('crea lote, kardex y gasto opcional', async () => {
      mockStock.create.mockResolvedValueOnce({} as never);
      mockLote.create.mockResolvedValueOnce({ id: 55 } as never);
      mockKardex.create.mockResolvedValueOnce({} as never);
      mockGastos.create.mockResolvedValueOnce({ id: 1 } as never);

      const result = await ingresoVale({
        bodega_id: 1, materia_prima_id: 7, cantidad: 20, fecha_vencimiento: '2027-06-01',
        gasto: { sucursal_id: 3, monto: 150 },
      });

      expect(result.lote).toEqual({ id: 55 });
      expect(result.gasto).toEqual({ id: 1 });
      expect(mockGastos.create).toHaveBeenCalledWith(
        expect.objectContaining({ sucursal_id: 3, monto_apertura: '0', monto_cierre_declarado: '150', monto_cierre_sistema: '150' }),
        expect.anything()
      );
    });

    it('no crea gasto si no se envía', async () => {
      mockStock.create.mockResolvedValueOnce({} as never);
      mockLote.create.mockResolvedValueOnce({ id: 56 } as never);
      mockKardex.create.mockResolvedValueOnce({} as never);

      const result = await ingresoVale({
        bodega_id: 1, materia_prima_id: 7, cantidad: 5, fecha_vencimiento: '2027-06-01',
      });

      expect(result.gasto).toBeNull();
      expect(mockGastos.create).not.toHaveBeenCalled();
      // el lote queda registrado en la bodega (si no, no aparece en stock ni se puede trasladar)
      expect(mockStock.create).toHaveBeenCalledWith({ bodega_id: 1, lote_id: 56 }, expect.anything());
    });
  });

  describe('cuadre', () => {
    it('rechaza cuando el lote no está en la bodega', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce(null as never);
      await expect(
        cuadre({ bodega_id: 1, items: [{ lote_id: 10, cantidad_fisica: 0 }] })
      ).rejects.toThrow('no se encuentra en la bodega');
    });

    it('rechaza lotes repetidos en el cuadre', async () => {
      await expect(
        cuadre({ bodega_id: 1, items: [{ lote_id: 10, cantidad_fisica: 1 }, { lote_id: 10, cantidad_fisica: 2 }] })
      ).rejects.toThrow('repetido');
    });

    it('rechaza cuando un lote no existe', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce({ bodega_id: 1, lote_id: 404 } as never);
      mockLote.getById.mockResolvedValueOnce(null as never);
      await expect(
        cuadre({ bodega_id: 1, items: [{ lote_id: 404, cantidad_fisica: 0 }] })
      ).rejects.toThrow('no encontrado');
    });

    it('registra merma cuando la cantidad física es menor', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce({ bodega_id: 1, lote_id: 10 } as never);
      mockLote.getById.mockResolvedValueOnce({ id: 10, cantidad_actual: '8', estado: 'VIGENTE' } as never);
      mockLote.update.mockResolvedValueOnce({} as never);
      mockKardex.create.mockResolvedValueOnce({} as never);

      const result = await cuadre({ bodega_id: 1, items: [{ lote_id: 10, cantidad_fisica: 5 }] });

      expect(result.ajustes[0]?.diferencia).toBe(-3);
      expect(mockKardex.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_movimiento: 'MERMA', cantidad: '3' }),
        expect.anything()
      );
    });

    it('no registra movimiento cuando no hay diferencia', async () => {
      mockStock.getByBodegaAndLote.mockResolvedValueOnce({ bodega_id: 1, lote_id: 10 } as never);
      mockLote.getById.mockResolvedValueOnce({ id: 10, cantidad_actual: '8', estado: 'VIGENTE' } as never);

      const result = await cuadre({ bodega_id: 1, items: [{ lote_id: 10, cantidad_fisica: 8 }] });

      expect(result.ajustes[0]?.diferencia).toBe(0);
      expect(mockKardex.create).not.toHaveBeenCalled();
      expect(mockLote.update).not.toHaveBeenCalled();
    });
  });

  describe('planificarConsumo (FEFO)', () => {
    const c = (lote_id: number, cantidad: number, origen: 'alacena' | 'bodega' = 'bodega') =>
      ({ lote_id, cantidad, origen, origen_id: 1 });

    it('toma del primer lote y completa con el siguiente, en el orden recibido', () => {
      const plan = planificarConsumo([c(1, 5, 'alacena'), c(2, 10), c(3, 4)], 8);
      expect(plan.map(p => [p.lote_id, p.tomar])).toEqual([[1, 5], [2, 3]]);
    });

    it('no toca lotes de más cuando el primero alcanza', () => {
      const plan = planificarConsumo([c(1, 20), c(2, 10)], 8);
      expect(plan).toHaveLength(1);
      expect(plan[0]).toMatchObject({ lote_id: 1, tomar: 8 });
    });

    it('lanza 409 con el faltante cuando no alcanza el stock', () => {
      try {
        planificarConsumo([c(1, 2), c(2, 3)], 10);
        expect.unreachable();
      } catch (e) {
        expect((e as { status: number }).status).toBe(409);
        expect((e as Error).message).toContain('5');
      }
    });

    it('maneja decimales sin errores de punto flotante', () => {
      const plan = planificarConsumo([c(1, 0.1), c(2, 0.2)], 0.3);
      expect(plan.reduce((a, p) => a + p.tomar, 0)).toBeCloseTo(0.3, 10);
    });
  });
});
