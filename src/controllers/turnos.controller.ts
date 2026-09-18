import { TurnoDespachadorModel } from '../model/supabase/turnoDespachador.model.js';
import logger from '../config/logger.js';

export const TurnosController = {
  async getAll() {
    try {
      const turnos = await TurnoDespachadorModel.getAll();
      return { data: turnos, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get turnos:');
      return { data: null, error: 'Error al obtener turnos', status: 500 };
    }
  },

  async getPendientesValidacion() {
    try {
      const turnos = await TurnoDespachadorModel.getAll();
      const pendientes = turnos.filter(t => t.cerrado_en && !t.monto_cierre_sistema);
      return { data: pendientes, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get turnos pendientes:');
      return { data: null, error: 'Error al obtener turnos pendientes', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const turno = await TurnoDespachadorModel.getById(id);
      if (!turno) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      return { data: turno, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error get turno:');
      return { data: null, error: 'Error al obtener turno', status: 500 };
    }
  },

  async apertura(data: { caja_id: number; usuario_id: number; administrador_id?: number; monto_apertura: number }) {
    try {
      if (!data.caja_id || !data.usuario_id || !data.monto_apertura) {
        return { data: null, error: 'caja_id, usuario_id y monto_apertura son requeridos', status: 400 };
      }
      const nuevoTurno = await TurnoDespachadorModel.create({
        caja_id: data.caja_id,
        usuario_id: data.usuario_id,
        administrador_id: data.administrador_id,
        monto_apertura: data.monto_apertura,
        abierto_en: new Date().toISOString()
      });
      return { data: nuevoTurno, error: null, status: 201 };
    } catch (error) {
      logger.error({ error }, 'Error apertura turno:');
      return { data: null, error: 'Error al abrir turno', status: 500 };
    }
  },

  async cierre(id: number, montoCierreDeclarado: number) {
    try {
      const turno = await TurnoDespachadorModel.update(id, {
        monto_cierre_declarado: montoCierreDeclarado,
        cerrado_en: new Date().toISOString()
      });
      if (!turno) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      return { data: turno, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error cierre turno:');
      return { data: null, error: 'Error al cerrar turno', status: 500 };
    }
  },

  async validar(id: number, montoCierreSistema: number) {
    try {
      const turno = await TurnoDespachadorModel.update(id, { monto_cierre_sistema: montoCierreSistema });
      if (!turno) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      const diferencia = (turno.monto_cierre_declarado || 0) - montoCierreSistema;
      return { data: { ...turno, diferencia }, error: null, status: 200 };
    } catch (error) {
      logger.error({ error }, 'Error validar turno:');
      return { data: null, error: 'Error al validar turno', status: 500 };
    }
  }
};