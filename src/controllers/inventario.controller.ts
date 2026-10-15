import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import logger from '../config/logger.js';
import { traslado, ingresoVale, cuadre } from '../services/inventario.service.js';

export const InventarioController = {
  async traslado(data: { bodega_origen_id: number; bodega_destino_id: number; lote_id: number; cantidad: number }) {
    try {
      const result = await traslado(data);
      return { data: result, error: null, status: 201 };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el traslado';
      const status = msg.includes('deben ser diferentes') || msg.includes('mayor al disponible') ? 400 :
                     msg.includes('no se encuentra') || msg.includes('no encontrado') ? 404 : 500;
      logger.error({ error }, 'Error traslado:');
      return { data: null, error: status === 500 ? 'Error al registrar el traslado' : msg, status };
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
      logger.error({ error }, 'Error ingreso-vale:');
      return { data: null, error: 'Error al registrar el ingreso por vale', status: 500 };
    }
  },

  async cuadre(data: { bodega_id: number; items: Array<{ lote_id: number; cantidad_fisica: number }> }) {
    try {
      const result = await cuadre(data);
      return { data: result, error: null, status: 200 };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al realizar el cuadre de inventario';
      const status = msg.includes('no encontrado') ? 404 : 500;
      logger.error({ error }, 'Error cuadre:');
      return { data: null, error: status === 500 ? 'Error al realizar el cuadre de inventario' : msg, status };
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
      logger.error({ error }, 'Error get inventario bajo-minimo:');
      return { data: null, error: 'Error al obtener inventario bajo mínimo', status: 500 };
    }
  }
};
