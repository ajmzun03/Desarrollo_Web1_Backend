import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

export const FacturasCompraController = {
  async getAll() {
    try {
      const facturas = await FacturaCompraModel.getAll();
      return { data: facturas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get facturas-compra:');
      return errorDb(error, 'Error al obtener facturas de compra');
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
      logger.error({ err: error }, 'Error get factura-compra:');
      return errorDb(error, 'Error al obtener factura de compra');
    }
  },

  async getByOrdenCompraId(ordenCompraId: number) {
    try {
      const facturas = await FacturaCompraModel.getByOrdenCompraId(ordenCompraId);
      return { data: facturas, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get facturas por orden de compra:');
      return errorDb(error, 'Error al obtener facturas por orden de compra');
    }
  },

  async create(data: { hoja_recepcion_id: number; serie: string; numero: string; fecha_emision: string; total: number }) {
    try {
      if (!data.hoja_recepcion_id || !data.serie || !data.numero || !data.fecha_emision || !data.total) {
        return { data: null, error: 'hoja_recepcion_id, serie, numero, fecha_emision y total son requeridos', status: 400 };
      }
      const nuevaFactura = await FacturaCompraModel.create({
        hoja_recepcion_id: data.hoja_recepcion_id,
        serie: data.serie,
        numero: data.numero,
        fecha_emision: data.fecha_emision,
        total: String(data.total)
      });
      return { data: nuevaFactura, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create factura-compra:');
      return errorDb(error, 'Error al crear factura de compra');
    }
  }
};