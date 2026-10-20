import { and, desc, eq, gte, lt, ne, sql, type SQL } from 'drizzle-orm';
import { db } from '../model/supabase/db.model.js';
import {
  pedidoTable,
  gastosSucursalTable,
  kardexBodegaTable,
  kardexAlacenaTable,
  facturaCompraTable,
  facturaVentaTable,
  bodegaTable,
  alacenaTable
} from '../schemas/db.schema.js';
import logger from '../config/logger.js';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { errorDb, ErrorNegocio } from '../utils/errors.js';

const LIMITE_FILAS = 1000;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarFecha(valor: string | undefined, nombre: string): string | undefined {
  if (valor === undefined || valor === '') return undefined;
  if (!FORMATO_FECHA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw new ErrorNegocio(`${nombre} debe tener formato YYYY-MM-DD`, 400);
  }
  return valor;
}

/** Límite superior exclusivo de un rango [desde, hasta]: el día siguiente a `hasta`. */
function diaSiguiente(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function rangoFechas(columna: Parameters<typeof gte>[0], desde?: string, hasta?: string): SQL[] {
  const condiciones: SQL[] = [];
  if (desde) condiciones.push(gte(columna, sql`${desde}::date`));
  if (hasta) condiciones.push(lt(columna, sql`${diaSiguiente(hasta)}::date`));
  return condiciones;
}

export const ReportesController = {
  async getUtilidadDiaria(sucursalId?: number, fecha?: string) {
    try {
      const dia = validarFecha(fecha, 'fecha') ?? new Date().toISOString().slice(0, 10);

      // Agregación en SQL: sin límite de filas ni carga en memoria
      const condVentas: SQL[] = [
        ne(pedidoTable.estado, 'ANULADO'),
        ...rangoFechas(pedidoTable.fecha_pedido, dia, dia)
      ];
      if (sucursalId) condVentas.push(eq(pedidoTable.sucursal_id, sucursalId));

      const condGastos: SQL[] = [...rangoFechas(gastosSucursalTable.abierto_en, dia, dia)];
      if (sucursalId) condGastos.push(eq(gastosSucursalTable.sucursal_id, sucursalId));

      const [ventasFila] = await db
        .select({ total: sql<string>`coalesce(sum(${pedidoTable.total}), 0)` })
        .from(pedidoTable).where(and(...condVentas));
      const [costosFila] = await db
        .select({ total: sql<string>`coalesce(sum(${gastosSucursalTable.monto_cierre_declarado}), 0)` })
        .from(gastosSucursalTable).where(and(...condGastos));

      const ventas = Number(ventasFila?.total ?? 0);
      const costos = Number(costosFila?.total ?? 0);
      return {
        data: { fecha: dia, sucursal_id: sucursalId ?? null, ventas, costos, utilidad: Math.round((ventas - costos) * 100) / 100 },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ err: error }, 'Error get utilidad-diaria:');
      return errorDb(error, 'Error al obtener reporte de utilidad diaria');
    }
  },

  async getGastosOperativos(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      const d = validarFecha(desde, 'desde');
      const h = validarFecha(hasta, 'hasta');
      const condiciones: SQL[] = [...rangoFechas(gastosSucursalTable.abierto_en, d, h)];
      if (sucursalId) condiciones.push(eq(gastosSucursalTable.sucursal_id, sucursalId));

      const [totales] = await db
        .select({
          total: sql<string>`coalesce(sum(${gastosSucursalTable.monto_cierre_declarado}), 0)`,
          cantidad: sql<string>`count(*)`
        })
        .from(gastosSucursalTable).where(and(...condiciones));
      const detalle = await db.select().from(gastosSucursalTable)
        .where(and(...condiciones)).orderBy(desc(gastosSucursalTable.id)).limit(LIMITE_FILAS);

      return {
        data: {
          desde: d, hasta: h,
          total_gastos: Number(totales?.total ?? 0),
          cantidad: Number(totales?.cantidad ?? 0),
          detalle
        },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ err: error }, 'Error get gastos-operativos:');
      return errorDb(error, 'Error al obtener reporte de gastos operativos');
    }
  },

  async getAnulaciones(desde?: string, hasta?: string, sucursalId?: number) {
    try {
      const d = validarFecha(desde, 'desde');
      const h = validarFecha(hasta, 'hasta');
      const condiciones: SQL[] = [eq(pedidoTable.estado, 'ANULADO'), ...rangoFechas(pedidoTable.fecha_pedido, d, h)];
      if (sucursalId) condiciones.push(eq(pedidoTable.sucursal_id, sucursalId));

      const [conteo] = await db.select({ cantidad: sql<string>`count(*)` }).from(pedidoTable).where(and(...condiciones));
      const detalle = await db.select().from(pedidoTable)
        .where(and(...condiciones)).orderBy(desc(pedidoTable.id)).limit(LIMITE_FILAS);

      return {
        data: { desde: d, hasta: h, total_anulaciones: Number(conteo?.cantidad ?? 0), detalle },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ err: error }, 'Error get anulaciones:');
      return errorDb(error, 'Error al obtener reporte de anulaciones');
    }
  },

  async getAuditoriaMovimientos(tipo?: string, sucursalId?: number, desde?: string, hasta?: string) {
    try {
      const d = validarFecha(desde, 'desde');
      const h = validarFecha(hasta, 'hasta');
      const soloKardex = tipo && tipo !== 'COMPRA' && tipo !== 'VENTA';
      const incluyeCompra = !tipo || tipo === 'COMPRA';
      const incluyeVenta = !tipo || tipo === 'VENTA';

      const movimientos: Array<Record<string, unknown>> = [];

      if (!tipo || soloKardex) {
        const condBodega: SQL[] = rangoFechas(kardexBodegaTable.fecha_movimiento, d, h);
        if (tipo) condBodega.push(eq(kardexBodegaTable.tipo_movimiento, tipo as never));
        if (sucursalId) condBodega.push(eq(bodegaTable.sucursal_id, sucursalId));
        const filasBodega = await db
          .select({ id: kardexBodegaTable.id, tipo: kardexBodegaTable.tipo_movimiento, fecha: kardexBodegaTable.fecha_movimiento, cantidad: kardexBodegaTable.cantidad })
          .from(kardexBodegaTable)
          .innerJoin(bodegaTable, eq(bodegaTable.id, kardexBodegaTable.bodega_id))
          .where(and(...condBodega)).orderBy(desc(kardexBodegaTable.fecha_movimiento)).limit(LIMITE_FILAS);
        movimientos.push(...filasBodega.map(f => ({ ...f, origen: 'BODEGA' })));

        const condAlacena: SQL[] = rangoFechas(kardexAlacenaTable.fecha_movimiento, d, h);
        if (tipo) condAlacena.push(eq(kardexAlacenaTable.tipo_movimiento, tipo as never));
        if (sucursalId) condAlacena.push(eq(bodegaTable.sucursal_id, sucursalId));
        const filasAlacena = await db
          .select({ id: kardexAlacenaTable.id, tipo: kardexAlacenaTable.tipo_movimiento, fecha: kardexAlacenaTable.fecha_movimiento, cantidad: kardexAlacenaTable.cantidad })
          .from(kardexAlacenaTable)
          .innerJoin(alacenaTable, eq(alacenaTable.id, kardexAlacenaTable.alacena_id))
          .innerJoin(bodegaTable, eq(bodegaTable.id, alacenaTable.bodega_id))
          .where(and(...condAlacena)).orderBy(desc(kardexAlacenaTable.fecha_movimiento)).limit(LIMITE_FILAS);
        movimientos.push(...filasAlacena.map(f => ({ ...f, origen: 'ALACENA' })));
      }

      if (incluyeCompra) {
        const filas = await db
          .select({ id: facturaCompraTable.id, fecha: facturaCompraTable.fecha_emision, total: facturaCompraTable.total })
          .from(facturaCompraTable)
          .where(and(...rangoFechas(facturaCompraTable.fecha_emision, d, h)))
          .orderBy(desc(facturaCompraTable.fecha_emision)).limit(LIMITE_FILAS);
        movimientos.push(...filas.map(f => ({ ...f, tipo: 'COMPRA', origen: 'COMPRA' })));
      }

      if (incluyeVenta) {
        const condVenta: SQL[] = rangoFechas(facturaVentaTable.fecha_emision, d, h);
        const consulta = db
          .select({ id: facturaVentaTable.id, fecha: facturaVentaTable.fecha_emision, total: facturaVentaTable.total })
          .from(facturaVentaTable);
        const filas = await (sucursalId
          ? consulta.innerJoin(pedidoTable, eq(pedidoTable.id, facturaVentaTable.pedido_id))
              .where(and(...condVenta, eq(pedidoTable.sucursal_id, sucursalId)))
          : consulta.where(and(...condVenta))
        ).orderBy(desc(facturaVentaTable.fecha_emision)).limit(LIMITE_FILAS);
        movimientos.push(...filas.map(f => ({ ...f, tipo: 'VENTA', origen: 'VENTA' })));
      }

      movimientos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      return {
        data: { tipo, desde: d, hasta: h, movimientos: movimientos.slice(0, LIMITE_FILAS) },
        error: null,
        status: 200
      };
    } catch (error) {
      logger.error({ err: error }, 'Error get auditoria:');
      return errorDb(error, 'Error al obtener auditoría de movimientos');
    }
  },

  async getRepartidoresDisponibles(_sucursalId?: number) {
    try {
      // Solo repartidores con la cuenta activa
      const repartidores = (await UsuarioModel.getByRol('REPARTIDOR')).filter(r => r.activo !== false);
      return { data: repartidores, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get repartidores:');
      return errorDb(error, 'Error al obtener repartidores disponibles');
    }
  }
};
