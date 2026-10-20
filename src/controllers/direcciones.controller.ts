import { DireccionModel } from '../model/supabase/direccion.model.js';
import logger from '../config/logger.js';
import { errorDb, ErrorNegocio } from '../utils/errors.js';
import { esCliente } from '../middleware/auth.js';
import type { DecodedToken } from '../jwt.js';

/** Un cliente solo accede a sus direcciones; si no es suya se responde como inexistente. */
function verificarDueno(direccion: { cliente_id: unknown }, user: DecodedToken) {
  if (esCliente(user) && Number(direccion.cliente_id) !== Number(user.id)) {
    throw new ErrorNegocio('Dirección no encontrada', 404);
  }
}

const ROLES_ESCRITURA = ['ADMIN', 'CAJERO'];

/** El personal solo escribe direcciones si es ADMIN o CAJERO; los clientes solo las suyas. */
function verificarEscritura(user: DecodedToken) {
  if (!esCliente(user) && !ROLES_ESCRITURA.includes(user.rol ?? '')) {
    throw new ErrorNegocio('Tu rol no puede modificar direcciones', 403);
  }
}

export const DireccionesController = {
  async getAll(user: DecodedToken, clienteIdSolicitado?: number) {
    try {
      const clienteId = esCliente(user) ? Number(user.id) : clienteIdSolicitado;
      const direcciones = await DireccionModel.getAll();
      const filtradas = clienteId ? direcciones.filter(d => Number(d.cliente_id) === clienteId) : direcciones;
      return { data: filtradas, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'No se encontraron direcciones') {
        return { data: [], error: null, status: 200 };
      }
      logger.error({ err: error }, 'Error get direcciones:');
      return errorDb(error, 'Error al obtener direcciones');
    }
  },

  async getById(id: number, user: DecodedToken) {
    try {
      const direccion = await DireccionModel.getById(id);
      verificarDueno(direccion, user);
      return { data: direccion, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Direccion no encontrada') {
        return { data: null, error: 'Dirección no encontrada', status: 404 };
      }
      logger.error({ err: error }, 'Error get direccion:');
      return errorDb(error, 'Error al obtener dirección');
    }
  },

  async create(
    data: { cliente_id?: number | undefined; municipio_id: number; direccion1: string; direccion2: string },
    user: DecodedToken
  ) {
    try {
      verificarEscritura(user);
      // Un cliente solo crea direcciones para sí mismo.
      const clienteId = esCliente(user) ? Number(user.id) : data.cliente_id;
      if (!clienteId) {
        return { data: null, error: 'cliente_id es requerido', status: 400 };
      }
      const nuevaDireccion = await DireccionModel.create({ ...data, cliente_id: clienteId });
      return { data: nuevaDireccion, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create direccion:');
      return errorDb(error, 'Error al crear dirección');
    }
  },

  async update(id: number, data: Record<string, any>, user: DecodedToken) {
    try {
      verificarEscritura(user);
      const actual = await DireccionModel.getById(id);
      verificarDueno(actual, user);
      const direccion = await DireccionModel.update(id, data);
      return { data: direccion, error: null, status: 200 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Direccion no encontrada') {
        return { data: null, error: 'Dirección no encontrada', status: 404 };
      }
      logger.error({ err: error }, 'Error update direccion:');
      return errorDb(error, 'Error al actualizar dirección');
    }
  }
};
