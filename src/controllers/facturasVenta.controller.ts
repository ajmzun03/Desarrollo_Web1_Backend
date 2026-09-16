import { FacturaVentaModel } from '../model/supabase/facturaVenta.model.js';

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
      console.error('Error get facturas-venta:', error);
      return { data: null, error: 'Error al obtener facturas de venta', status: 500 };
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
      console.error('Error get factura-venta:', error);
      return { data: null, error: 'Error al obtener factura de venta', status: 500 };
    }
  },

  async create(data: { pedido_id: number; serie: string; numero: string; fecha_emision?: string; total: number }) {
    try {
      if (!data.pedido_id || !data.serie || !data.numero || !data.total) {
        return { data: null, error: 'pedido_id, serie, numero y total son requeridos', status: 400 };
      }
      const nuevaFactura = await FacturaVentaModel.create({
        pedido_id: data.pedido_id,
        serie: data.serie,
        numero: data.numero,
        fecha_emision: data.fecha_emision,
        total: data.total
      });
      return { data: nuevaFactura, error: null, status: 201 };
    } catch (error) {
      console.error('Error create factura-venta:', error);
      return { data: null, error: 'Error al crear factura de venta', status: 500 };
    }
  }
};