import { PedidoModel } from '../model/supabase/pedido.model.js';
import logger from '../config/logger.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { KardexAlacenaModel } from '../model/supabase/kardexAlacena.model.js';
import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';
import { FacturaVentaModel } from '../model/supabase/facturaVenta.model.js';
import { UsuarioModel } from '../model/supabase/usuario.model.js';

async function safeGetAll<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn(); } catch { return []; }
}

function startsWithDate(dateStr: string | null | undefined, fecha: string): boolean {
  if (!dateStr) return false;
  return dateStr.startsWith(fecha);
}

function inRange(dateStr: string | null | undefined, desde?: string, hasta?: string): boolean {
  if (!dateStr) return false;
  if (desde && dateStr < desde) return false;
  if (hasta && dateStr > hasta + 'T23:59:59') return false;
  return true;
}

export const ReportesController = {
  async getUtilidadDiaria(sucursalId?: number, fecha?: string) {
    try {
      const fechaBusqueda = fecha ?? new Date().toISOString().split('T')[0] ?? '';
      const pedidos = await safeGetAll(() => PedidoModel.getAll());
      const sid = sucursalId;
      const gastos = await safeGetAll(() =>
        sid ? GastosSucursalModel.getBySucursalId(sid) : GastosSucursalModel.getAll()
      );

      const ventas = pedidos
        .filter(p => p.estado !== 'ANULADO' && startsWithDate(p.fecha_pedido, fechaBusqueda))
        .reduce((acc, p) => acc + (p.total ?? 0), 0);

      const costos = gastos
        .filter(g => startsWithDate(g.abierto_en, fechaBusqueda))
        .reduce((acc, g) => acc + (g.monto_cierre_declarado ?? 0), 0);

      return {
        data: { fecha: fechaBusqueda, ventas, costos, utilidad: ventas - costos },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ error }, 'Error get utilidad-diaria:');
      return { data: null, error: 'Error al obtener reporte de utilidad diaria', status: 500 };
    }
  },

  async getGastosOperativos(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      const sid = sucursalId;
      const gastos = await safeGetAll(() =>
        sid ? GastosSucursalModel.getBySucursalId(sid) : GastosSucursalModel.getAll()
      );

      const filtrados = gastos.filter(g => inRange(g.abierto_en, desde, hasta));
      const total = filtrados.reduce((acc, g) => acc + (g.monto_cierre_declarado ?? 0), 0);

      return {
        data: { desde, hasta, total_gastos: total, detalle: filtrados },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ error }, 'Error get gastos-operativos:');
      return { data: null, error: 'Error al obtener reporte de gastos operativos', status: 500 };
    }
  },

  async getAnulaciones(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      const pedidos = await safeGetAll(() => PedidoModel.getByEstado('ANULADO'));
      const filtrados = pedidos.filter(p => inRange(p.fecha_pedido, desde, hasta));
      return {
        data: { desde, hasta, total_anulaciones: filtrados.length, detalle: filtrados },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ error }, 'Error get anulaciones:');
      return { data: null, error: 'Error al obtener reporte de anulaciones', status: 500 };
    }
  },

  async getAuditoriaMovimientos(tipo?: string, sucursalId?: number, desde?: string, hasta?: string) {
    try {
      const kardexBodega = await safeGetAll(() => KardexBodegaModel.getAll());
      const kardexAlacena = await safeGetAll(() => KardexAlacenaModel.getAll());
      const facturasCompra = await safeGetAll(() => FacturaCompraModel.getAll());
      const facturasVenta = await safeGetAll(() => FacturaVentaModel.getAll());

      const movimientosKardex = [
        ...kardexBodega.map(k => ({ tipo: k.tipo_movimiento, fecha: k.fecha_movimiento, origen: 'BODEGA', id: k.id, cantidad: k.cantidad })),
        ...kardexAlacena.map(k => ({ tipo: k.tipo_movimiento, fecha: k.fecha_movimiento, origen: 'ALACENA', id: k.id, cantidad: k.cantidad }))
      ];

      const movimientosFacturas = [
        ...facturasCompra.map(f => ({ tipo: 'COMPRA', fecha: f.fecha_emision, origen: 'COMPRA', id: f.id, total: f.total })),
        ...facturasVenta.map(f => ({ tipo: 'VENTA', fecha: f.fecha_emision, origen: 'VENTA', id: f.id, total: f.total }))
      ];

      let todos = [...movimientosKardex, ...movimientosFacturas];
      if (tipo) todos = todos.filter(m => m.tipo === tipo);
      if (desde) todos = todos.filter(m => m.fecha && m.fecha >= desde);
      if (hasta) todos = todos.filter(m => m.fecha && m.fecha <= hasta + 'T23:59:59');

      return { data: { tipo, desde, hasta, movimientos: todos }, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get auditoria:');
      return { data: null, error: 'Error al obtener auditoría de movimientos', status: 500 };
    }
  },

  async getRepartidoresDisponibles(sucursalId?: number) {
    try {
      const repartidores = await UsuarioModel.getByRol('REPARTIDOR');
      return { data: repartidores, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get repartidores:');
      return { data: null, error: 'Error al obtener repartidores disponibles', status: 500 };
    }
  }
};
