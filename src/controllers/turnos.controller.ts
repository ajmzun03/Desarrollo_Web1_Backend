import { TurnoDespachadorModel } from '../model/supabase/turnoDespachador.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { ErrorNegocio } from '../utils/errors.js';
import type { DecodedToken } from '../jwt.js';

export const TurnosController = {
  async getAll() {
    try {
      const turnos = await TurnoDespachadorModel.getAll();
      return { data: turnos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get turnos:');
      return errorDb(error, 'Error al obtener turnos');
    }
  },

  async getPendientesValidacion() {
    try {
      const turnos = await TurnoDespachadorModel.getAll();
      const pendientes = turnos.filter(t => t.cerrado_en && !t.monto_cierre_sistema);
      return { data: pendientes, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get turnos pendientes:');
      return errorDb(error, 'Error al obtener turnos pendientes');
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
      logger.error({ err: error }, 'Error get turno:');
      return errorDb(error, 'Error al obtener turno');
    }
  },

  async apertura(data: { caja_id: number; usuario_id?: number | undefined; administrador_id?: number | undefined; monto_apertura: number }, user: DecodedToken) {
    try {
      // El despachador abre SU turno; solo el ADMIN puede abrir uno a nombre de otra persona
      const usuarioId = user.rol === 'ADMIN' && data.usuario_id ? data.usuario_id : Number(user.id);
      if (!data.caja_id || data.monto_apertura === undefined || data.monto_apertura === null) {
        return { data: null, error: 'caja_id y monto_apertura son requeridos', status: 400 };
      }

      // Una caja no puede tener dos turnos abiertos a la vez, ni una persona dos turnos
      const turnos = await TurnoDespachadorModel.getAll();
      const abiertos = turnos.filter(t => !t.cerrado_en);
      if (abiertos.some(t => Number(t.caja_id) === data.caja_id)) {
        throw new ErrorNegocio('La caja ya tiene un turno abierto', 409);
      }
      if (abiertos.some(t => Number(t.usuario_id) === usuarioId)) {
        throw new ErrorNegocio('El usuario ya tiene un turno abierto', 409);
      }

      const nuevoTurno = await TurnoDespachadorModel.create({
        caja_id: data.caja_id,
        usuario_id: usuarioId,
        administrador_id: data.administrador_id,
        monto_apertura: String(data.monto_apertura),
        abierto_en: new Date().toISOString()
      });
      return { data: nuevoTurno, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error apertura turno:');
      return errorDb(error, 'Error al abrir turno');
    }
  },

  async cierre(id: number, montoCierreDeclarado: number, user: DecodedToken) {
    try {
      const actual = await TurnoDespachadorModel.getById(id);
      if (!actual) throw new ErrorNegocio('Turno no encontrado', 404);
      if (actual.cerrado_en) throw new ErrorNegocio('El turno ya fue cerrado', 409);
      // Solo quien abrió el turno (o un ADMIN) puede cerrarlo
      if (user.rol !== 'ADMIN' && Number(actual.usuario_id) !== Number(user.id)) {
        throw new ErrorNegocio('Solo quien abrió el turno puede cerrarlo', 403);
      }
      const turno = await TurnoDespachadorModel.update(id, {
        monto_cierre_declarado: String(montoCierreDeclarado),
        cerrado_en: new Date().toISOString()
      });
      if (!turno) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      return { data: turno, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error cierre turno:');
      return errorDb(error, 'Error al cerrar turno');
    }
  },

  async validar(id: number, montoCierreSistema: number) {
    try {
      const actual = await TurnoDespachadorModel.getById(id);
      if (!actual) throw new ErrorNegocio('Turno no encontrado', 404);
      if (!actual.cerrado_en) throw new ErrorNegocio('El turno aún no está cerrado', 409);
      if (actual.monto_cierre_sistema !== null) throw new ErrorNegocio('El turno ya fue validado', 409);
      const turno = await TurnoDespachadorModel.update(id, { monto_cierre_sistema: String(montoCierreSistema) });
      if (!turno) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      const diferencia = Number(turno.monto_cierre_declarado || 0) - montoCierreSistema;
      return { data: { ...turno, diferencia }, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error validar turno:');
      return errorDb(error, 'Error al validar turno');
    }
  },

  async sencillo(id: number, monto: number) {
    try {
      const turnoActual = await TurnoDespachadorModel.getById(id);
      if (!turnoActual) {
        return { data: null, error: 'Turno no encontrado', status: 404 };
      }
      if (turnoActual.cerrado_en) {
        return { data: null, error: 'No se puede asignar sencillo a un turno cerrado', status: 400 };
      }
      const acumulado = Number(turnoActual.monto_apertura) + monto;
      const turno = await TurnoDespachadorModel.update(id, { monto_apertura: String(acumulado) });
      return { data: turno, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error sencillo turno:');
      return errorDb(error, 'Error al asignar sencillo');
    }
  }
};