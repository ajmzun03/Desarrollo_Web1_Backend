import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';

export const GastosSucursalController = {
  async getAll(sucursalId?: number) {
    try {
      let gastos;
      if (sucursalId) {
        gastos = await GastosSucursalModel.getBySucursalId(sucursalId);
      } else {
        gastos = await GastosSucursalModel.getAll();
      }
      return { data: gastos, error: null, status: 200 };
    } catch (error) {
      console.error('Error get gastos-sucursal:', error);
      return { data: null, error: 'Error al obtener gastos de sucursal', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const gasto = await GastosSucursalModel.getById(id);
      if (!gasto) {
        return { data: null, error: 'Gasto de sucursal no encontrado', status: 404 };
      }
      return { data: gasto, error: null, status: 200 };
    } catch (error) {
      console.error('Error get gasto-sucursal:', error);
      return { data: null, error: 'Error al obtener gasto de sucursal', status: 500 };
    }
  },

  async create(data: { caja_id?: number; usuario_id?: number; sucursal_id: number; monto_apertura?: number; monto_cierre_declarado?: number; monto_cierre_sistema?: number }) {
    try {
      if (!data.sucursal_id) {
        return { data: null, error: 'sucursal_id es requerido', status: 400 };
      }
      const nuevoGasto = await GastosSucursalModel.create({
        caja_id: data.caja_id,
        usuario_id: data.usuario_id,
        sucursal_id: data.sucursal_id,
        monto_apertura: data.monto_apertura,
        monto_cierre_declarado: data.monto_cierre_declarado,
        monto_cierre_sistema: data.monto_cierre_sistema,
        abierto_en: data.monto_apertura ? new Date().toISOString() : undefined,
        cerrado_en: data.monto_cierre_declarado ? new Date().toISOString() : undefined
      });
      return { data: nuevoGasto, error: null, status: 201 };
    } catch (error) {
      console.error('Error create gasto-sucursal:', error);
      return { data: null, error: 'Error al crear gasto de sucursal', status: 500 };
    }
  }
};