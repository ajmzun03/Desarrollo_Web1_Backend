import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { StockBodegaModel } from '../model/supabase/stockBodega.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
import logger from '../config/logger.js';

export const InventarioController = {
  async traslado(data: { bodega_origen_id: number; bodega_destino_id: number; lote_id: number; cantidad: number }) {
    try {
      if (data.bodega_origen_id === data.bodega_destino_id) {
        return { data: null, error: 'La bodega de origen y destino deben ser diferentes', status: 400 };
      }
      const stockOrigen = await StockBodegaModel.getByBodegaAndLote(data.bodega_origen_id, data.lote_id);
      if (!stockOrigen) {
        return { data: null, error: 'El lote no se encuentra en la bodega de origen', status: 404 };
      }
      const lote = await LoteMateriaPrimaModel.getById(data.lote_id);
      if (!lote) {
        return { data: null, error: 'Lote no encontrado', status: 404 };
      }
      const cantidadActual = Number(lote.cantidad_actual);
      if (data.cantidad > cantidadActual) {
        return { data: null, error: `Cantidad a trasladar (${data.cantidad}) mayor al disponible (${cantidadActual})`, status: 400 };
      }

      const restante = cantidadActual - data.cantidad;
      await LoteMateriaPrimaModel.update(data.lote_id, {
        cantidad_actual: String(restante),
        estado: restante === 0 ? ('AGOTADO' as any) : lote.estado
      });

      const loteDestino = await LoteMateriaPrimaModel.create({
        materia_prima_id: lote.materia_prima_id,
        fecha_vencimiento: lote.fecha_vencimiento,
        cantidad_inicial: String(data.cantidad),
        cantidad_actual: String(data.cantidad),
        estado: 'VIGENTE'
      });
      const stockDestino = await StockBodegaModel.getByBodegaAndLote(data.bodega_destino_id, Number(loteDestino.id));
      if (!stockDestino) {
        await StockBodegaModel.create({ bodega_id: data.bodega_destino_id, lote_id: Number(loteDestino.id) });
      }

      await KardexBodegaModel.create({
        bodega_id: data.bodega_origen_id,
        lote_id: data.lote_id,
        tipo_movimiento: 'TRASLADO',
        cantidad: String(data.cantidad)
      });
      await KardexBodegaModel.create({
        bodega_id: data.bodega_destino_id,
        lote_id: Number(loteDestino.id),
        tipo_movimiento: 'TRASLADO',
        cantidad: String(data.cantidad)
      });

      return {
        data: {
          lote_origen_id: data.lote_id,
          lote_destino_id: Number(loteDestino.id),
          bodega_origen_id: data.bodega_origen_id,
          bodega_destino_id: data.bodega_destino_id,
          cantidad_trasladada: data.cantidad,
          saldo_origen: restante
        },
        error: null,
        status: 201
      };
    } catch (error) {
      logger.error({ error }, 'Error traslado:');
      return { data: null, error: 'Error al registrar el traslado', status: 500 };
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
      const lote = await LoteMateriaPrimaModel.create({
        materia_prima_id: data.materia_prima_id,
        fecha_vencimiento: data.fecha_vencimiento,
        cantidad_inicial: String(data.cantidad),
        cantidad_actual: String(data.cantidad),
        estado: 'VIGENTE'
      });
      await KardexBodegaModel.create({
        bodega_id: data.bodega_id,
        lote_id: Number(lote.id),
        tipo_movimiento: 'INGRESO',
        cantidad: String(data.cantidad)
      });

      let gasto = null;
      if (data.gasto) {
        gasto = await GastosSucursalModel.create({
          sucursal_id: data.gasto.sucursal_id,
          caja_id: data.gasto.caja_id,
          usuario_id: data.gasto.usuario_id,
          monto_apertura: String(data.gasto.monto),
          monto_cierre_declarado: String(data.gasto.monto),
          monto_cierre_sistema: String(data.gasto.monto)
        });
      }

      return {
        data: { lote, gasto, descripcion: data.descripcion ?? null },
        error: null,
        status: 201
      };
    } catch (error) {
      logger.error({ error }, 'Error ingreso-vale:');
      return { data: null, error: 'Error al registrar el ingreso por vale', status: 500 };
    }
  },

  async cuadre(data: { bodega_id: number; items: Array<{ lote_id: number; cantidad_fisica: number }> }) {
    try {
      const resultados: Array<Record<string, any>> = [];
      for (const item of data.items) {
        const lote = await LoteMateriaPrimaModel.getById(item.lote_id);
        if (!lote) {
          return { data: null, error: `Lote ${item.lote_id} no encontrado`, status: 404 };
        }
        const cantidadSistema = Number(lote.cantidad_actual);
        const diferencia = item.cantidad_fisica - cantidadSistema;

        if (diferencia !== 0) {
          await LoteMateriaPrimaModel.update(item.lote_id, {
            cantidad_actual: String(item.cantidad_fisica),
            estado: item.cantidad_fisica === 0 ? ('AGOTADO' as any) : lote.estado
          });
          await KardexBodegaModel.create({
            bodega_id: data.bodega_id,
            lote_id: item.lote_id,
            tipo_movimiento: diferencia < 0 ? 'MERMA' : 'INGRESO',
            cantidad: String(Math.abs(diferencia))
          });
        }

        resultados.push({
          lote_id: item.lote_id,
          cantidad_sistema: cantidadSistema,
          cantidad_fisica: item.cantidad_fisica,
          diferencia
        });
      }
      return { data: { bodega_id: data.bodega_id, ajustes: resultados }, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error cuadre:');
      return { data: null, error: 'Error al realizar el cuadre de inventario', status: 500 };
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
