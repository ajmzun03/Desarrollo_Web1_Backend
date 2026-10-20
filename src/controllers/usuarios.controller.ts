import type { UpdateUsuario } from '../schemas/db.schema.js';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';
import { hashPassword } from '../utils/hashPassword.js';
import { revocarSesionesDe } from '../services/sesiones.service.js';
import { ErrorNegocio } from '../utils/errors.js';

export const UsuariosController = {
  async getAll() {
    try {
      const usuarios = await UsuarioModel.getAll();
      return { data: usuarios, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get usuarios:');
      return errorDb(error, 'Error al obtener usuarios');
    }
  },

  async getById(id: number) {
    try {
      const usuario = await UsuarioModel.getById(id);
      if (!usuario) {
        return { data: null, error: 'Usuario no encontrado', status: 404 };
      }
      return { data: usuario, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get usuario:');
      return errorDb(error, 'Error al obtener usuario');
    }
  },

  async create(data: { usuario: string; correo_electronico: string; telefono: string; contrasenia: string; rol: 'ADMIN' | 'BODEGUERO' | 'DESPACHADOR' | 'REPARTIDOR' | 'CAJERO' | 'GERENTE' | 'COMPRAS' | 'COCINERO' | 'JEFE_COCINA'; activo?: boolean | undefined }) {
    try {
      if (!data.usuario || !data.contrasenia || !data.rol || !data.telefono) {
        return { data: null, error: 'usuario, contrasenia, telefono y rol son requeridos', status: 400 };
      }
      const hashedPassword = await hashPassword(data.contrasenia);
      const nuevoUsuario = await UsuarioModel.create({
        ...data,
        contrasenia: hashedPassword
      });
      const { contrasenia: _, ...userWithoutPassword } = nuevoUsuario;
      return { data: userWithoutPassword, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create usuario:');
      return errorDb(error, 'Error al crear usuario');
    }
  },

  async update(id: number, data: { contrasenia?: string; activo?: boolean; rol?: UpdateUsuario['rol']; [key: string]: any }, actorId?: number) {
    try {
      // Evita que un ADMIN se deje sin acceso por accidente
      if (actorId === id && (data.activo === false || (data.rol && data.rol !== 'ADMIN'))) {
        throw new ErrorNegocio('No puedes desactivarte ni quitarte el rol de ADMIN a ti mismo', 400);
      }
      const cambiaClave = Boolean(data.contrasenia);
      if (data.contrasenia) {
        data.contrasenia = await hashPassword(data.contrasenia);
      }
      const usuario = await UsuarioModel.update(id, data as UpdateUsuario);
      if (!usuario) {
        return { data: null, error: 'Usuario no encontrado', status: 404 };
      }
      // Desactivar, cambiar la clave o el rol invalida las sesiones abiertas de ese usuario
      if (data.activo === false || cambiaClave || data.rol) {
        await revocarSesionesDe('usuario', id);
      }
      const { contrasenia: _, ...userWithoutPassword } = usuario;
      return { data: userWithoutPassword, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update usuario:');
      return errorDb(error, 'Error al actualizar usuario');
    }
  }
};