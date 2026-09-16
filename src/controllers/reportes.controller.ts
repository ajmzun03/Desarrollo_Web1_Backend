import { PedidoModel } from '../model/supabase/pedido.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';

export const ReportesController = {
  async getUtilidadDiaria(sucursalId?: number, fecha?: string) {
    try {
      const pedidos = await PedidoModel.getAll();
      const gastos = await GastosSucursalModel.getAll();
      return {
        data: {
          fecha: fecha || new Date().toISOString().split('T')[0],
          ventas: 0,
          costos: 0,
          utilidad: 0
        },
        error: null,
        status: 200
      };
    } catch (error) {
      console.error('Error get utilidad-diaria:', error);
      return { data: null, error: 'Error al obtener reporte de utilidad diaria', status: 500 };
    }
  },

  async getGastosOperativos(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      let gastos;
      if (sucursalId) {
        gastos = await GastosSucursalModel.getBySucursalId(sucursalId);
      } else {
        gastos = await GastosSucursalModel.getAll();
      }
      const total = gastos.reduce((acc, g) => acc + (g.monto_cierre_declarado || 0), 0);
      return {
        data: { desde, hasta, total_gastos: total, detalle: gastos },
        error: null,
        status: 200
      };
    } catch (error) {
      console.error('Error get gastos-operativos:', error);
      return { data: null, error: 'Error al obtener reporte de gastos operativos', status: 500 };
    }
  },

  async getAnulaciones(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      const pedidos = await PedidoModel.getByEstado('ANULADO');
      return {
        data: { desde, hasta, total_anulaciones: pedidos.length, detalle: pedidos },
        error: null,
        status: 200
      };
    } catch (error) {
      console.error('Error get anulaciones:', error);
      return { data: null, error: 'Error al obtener reporte de anulaciones', status: 500 };
    }
  },

  async getAuditoriaMovimientos(tipo?: string, sucursalId?: number, desde?: string, hasta?: string) {
    try {
      const movimientos = await KardexBodegaModel.getAll();
      return {
        data: { tipo, desde, hasta, movimientos },
        error: null,
        status: 200
      };
    } catch (error) {
      console.error('Error get auditoria:', error);
      return { data: null, error: 'Error al obtener auditoría de movimientos', status: 500 };
    }
  },

  async getRepartidoresDisponibles(sucursalId?: number) {
    try {
      return { data: [], error: null, status: 200 };
    } catch (error) {
      console.error('Error get repartidores:', error);
      return { data: null, error: 'Error al obtener repartidores disponibles', status: 500 };
    }
  }
};