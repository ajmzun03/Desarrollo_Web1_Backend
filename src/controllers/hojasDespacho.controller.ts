import { HojaDespachoModel, HojaDespachoDetalleModel } from '../model/supabase/hojaDespacho.model.js';

export const HojasDespachoController = {
  async getAll() {
    try {
      const hojas = await HojaDespachoModel.getAll();
      return { data: hojas, error: null, status: 200 };
    } catch (error) {
      console.error('Error get hojas-despacho:', error);
      return { data: null, error: 'Error al obtener hojas de despacho', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const hoja = await HojaDespachoModel.getById(id);
      if (!hoja) {
        return { data: null, error: 'Hoja de despacho no encontrada', status: 404 };
      }
      const detalles = await HojaDespachoDetalleModel.getByHojaDespachoId(id);
      return { data: { ...hoja, detalles }, error: null, status: 200 };
    } catch (error) {
      console.error('Error get hoja-despacho:', error);
      return { data: null, error: 'Error al obtener hoja de despacho', status: 500 };
    }
  },

  async create(data: { pedido_id: number; sucursal_despacho: number; items?: Array<{ producto_lote_id: number; cantidad_despachada: number }> }) {
    try {
      if (!data.pedido_id || !data.sucursal_despacho) {
        return { data: null, error: 'pedido_id y sucursal_despacho son requeridos', status: 400 };
      }
      const nuevaHoja = await HojaDespachoModel.create({
        pedido_id: data.pedido_id,
        sucursal_despacho: data.sucursal_despacho,
        despachado_en: new Date().toISOString()
      });
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await HojaDespachoDetalleModel.create({
            hoja_despacho_id: Number(nuevaHoja.id),
            producto_lote_id: item.producto_lote_id,
            cantidad_despachada: item.cantidad_despachada
          });
        }
      }
      const detalles = await HojaDespachoDetalleModel.getByHojaDespachoId(Number(nuevaHoja.id));
      return { data: { ...nuevaHoja, detalles }, error: null, status: 201 };
    } catch (error) {
      console.error('Error create hoja-despacho:', error);
      return { data: null, error: 'Error al crear hoja de despacho', status: 500 };
    }
  }
};