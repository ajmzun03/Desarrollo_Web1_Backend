import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';
import logger from '../config/logger.js';

export const FacturasCompraController = {
  async getAll() {
    try {
      const facturas = await FacturaCompraModel.getAll();
      return { data: facturas, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get facturas-compra:');
      return { data: null, error: 'Error al obtener facturas de compra', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const factura = await FacturaCompraModel.getById(id);
      if (!factura) {
        return { data: null, error: 'Factura de compra no encontrada', status: 404 };
      }
      return { data: factura, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get factura-compra:');
      return { data: null, error: 'Error al obtener factura de compra', status: 500 };
    }
  },

  async create(data: { hoja_recepcion_id: number; serie: string; numero: string; fecha_emision: string; total: number }) {
    try {
      if (!data.hoja_recepcion_id || !data.serie || !data.numero || !data.fecha_emision || !data.total) {
        return { data: null, error: 'hoja_recepcion_id, serie, numero, fecha_emision y total son requeridos', status: 400 };
      }
      const nuevaFactura = await FacturaCompraModel.create(data);
      return { data: nuevaFactura, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error create factura-compra:');
      return { data: null, error: 'Error al crear factura de compra', status: 500 };
    }
  }
};