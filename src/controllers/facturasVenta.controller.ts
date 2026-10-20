import { FacturaVentaModel } from '../model/supabase/facturaVenta.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { ErrorNegocio } from '../utils/errors.js';

export const FacturasVentaController = {
  async getAll(pedidoId?: number) {
    try {
      const facturas = pedidoId
        ? await FacturaVentaModel.getByPedidoId(pedidoId)
        : await FacturaVentaModel.getAll();
      return { data: facturas, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'No se encontraron facturas de venta') {
        return { data: [], error: null, status: 200 };
      }
      logger.error({ err: error }, 'Error get facturas-venta:');
      return errorDb(error, 'Error al obtener facturas de venta');
    }
  },

  async getById(id: number) {
    try {
      const factura = await FacturaVentaModel.getById(id);
      return { data: factura, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Factura de venta no encontrada') {
        return { data: null, error: 'Factura de venta no encontrada', status: 404 };
      }
      logger.error({ err: error }, 'Error get factura-venta:');
      return errorDb(error, 'Error al obtener factura de venta');
    }
  },

  async create(data: { pedido_id: number; serie: string; numero: string; fecha_emision?: string | undefined; total?: number | undefined }) {
    try {
      if (!data.pedido_id || !data.serie || !data.numero) {
        return { data: null, error: 'pedido_id, serie y numero son requeridos', status: 400 };
      }
      const pedido = await PedidoModel.getPedidoId(data.pedido_id);
      if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
      if (pedido.estado === 'ANULADO') throw new ErrorNegocio('No se factura un pedido ANULADO', 409);

      const existentes = await FacturaVentaModel.getByPedidoId(data.pedido_id);
      if (existentes.length > 0) throw new ErrorNegocio('El pedido ya tiene una factura', 409);

      // El total sale del pedido; si el cliente lo envía debe coincidir (no se factura un monto distinto)
      const totalPedido = Number(pedido.total);
      if (data.total !== undefined && Math.round(data.total * 100) !== Math.round(totalPedido * 100)) {
        throw new ErrorNegocio(`El total (${data.total}) no coincide con el del pedido (${totalPedido})`, 400);
      }

      const nuevaFactura = await FacturaVentaModel.create({
        pedido_id: data.pedido_id,
        serie: data.serie,
        numero: data.numero,
        fecha_emision: data.fecha_emision,
        total: String(pedido.total)
      });
      return { data: nuevaFactura, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create factura-venta:');
      return errorDb(error, 'Error al crear factura de venta');
    }
  }
};
