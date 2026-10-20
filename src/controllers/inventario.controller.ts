import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { traslado, ingresoVale, cuadre, trasladoAAlacena } from '../services/inventario.service.js';

export const InventarioController = {
  async traslado(data: { bodega_origen_id: number; bodega_destino_id: number; lote_id: number; cantidad: number }) {
    try {
      const result = await traslado(data);
      return { data: result, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error traslado:');
      return errorDb(error, 'Error al registrar el traslado');
    }
  },

  async ingresoVale(data: {
    bodega_id: number;
    materia_prima_id: number;
    cantidad: number;
    fecha_vencimiento: string;
    descripcion?: string;
    gasto?: { sucursal_id: number; caja_id?: number; usuario_id?: number; monto: number };
  }) {
    try {
      const result = await ingresoVale(data);
      return { data: result, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error ingreso-vale:');
      return errorDb(error, 'Error al registrar el ingreso por vale');
    }
  },

  async cuadre(data: { bodega_id: number; items: Array<{ lote_id: number; cantidad_fisica: number }> }) {
    try {
      const result = await cuadre(data);
      return { data: result, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error cuadre:');
      return errorDb(error, 'Error al realizar el cuadre de inventario');
    }
  },

  async trasladoAlacena(data: { bodega_id: number; alacena_id: number; lote_id: number; cantidad: number }) {
    try {
      const result = await trasladoAAlacena(data);
      return { data: result, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error traslado a alacena:');
      return errorDb(error, 'Error al trasladar a la alacena');
    }
  },

  async getBajoMinimo(sucursalId?: number, umbral?: number) {
    try {
      if (!sucursalId) {
        return { data: null, error: 'sucursal_id es requerido', status: 400 };
      }
      const lotes = await LoteMateriaPrimaModel.getBajoMinimoPorSucursal(sucursalId, umbral ?? 0);
      return { data: lotes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get inventario bajo-minimo:');
      return errorDb(error, 'Error al obtener inventario bajo mínimo');
    }
  }
};
