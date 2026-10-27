import { UsuarioClienteModel } from '../model/supabase/usuarioCliente.model.js';
import { ClienteModel } from '../model/supabase/cliente.model.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { PASSWORD_RESET_URL_CLIENTE } from '../config.js';
import logger from '../config/logger.js';
import { vistasDe } from '../config/vistas.js';
import { revocarToken, revocarSesionesDe } from '../services/sesiones.service.js';
import {
  SupabaseAuthError,
  enviarCorreoRecuperacion,
  supabaseConfigurado,
  verificarEnlaceRecuperacion
} from '../services/supabaseAuth.service.js';
import type { DecodedToken } from '../jwt.js';

const ENLACE_INVALIDO = 'El enlace es inválido, venció o ya fue usado. Solicita uno nuevo.';

/** Token de sesión de un cliente final. */
function tokenDeCliente(cliente: { id: number | string; correo_electronico: string | null }) {
  return generarToken({
    id: Number(cliente.id),
    correo_electronico: cliente.correo_electronico,
    rol: 'CLIENTE',
    tipo: 'cliente'
  });
}

/**
 * Autenticación del cliente final: correo y contraseña, SIN segundo factor.
 * Supabase Auth solo se usa para el correo de recuperación de contraseña.
 */
export const UsuarioClienteController = {
  async registro(data: {
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
    telefono_ref?: string;
    contrasenia: string;
  }) {
    try {
      const existente = await UsuarioClienteModel.getByCorreo(data.correo_electronico);
      if (existente) {
        return { data: null, error: 'Ya existe una cuenta con este correo electrónico', status: 409 };
      }

      const hashedPassword = await hashPassword(data.contrasenia);
      const resultado = await UsuarioClienteModel.create({
        cliente: {
          nombre: data.nombre,
          apellido: data.apellido,
          correo_electronico: data.correo_electronico,
          telefono: data.telefono,
          telefono_ref: data.telefono_ref ?? null
        },
        contrasenia: hashedPassword
      });

      return {
        data: {
          cliente: resultado.cliente,
          token: tokenDeCliente(resultado.cliente),
          vistas: vistasDe('CLIENTE')
        },
        error: null,
        status: 201
      };
    } catch (error: any) {
      const pg = error?.cause ?? error;
      if (pg?.code === '23505') {
        const campo = String(pg.constraint_name ?? pg.constraint ?? error?.message ?? '');
        const mensaje = /telefono_ref/.test(campo)
          ? 'El teléfono de referencia ya está registrado'
          : /telefono/.test(campo)
            ? 'Ya existe una cuenta con este número de teléfono'
            : 'Ya existe una cuenta con estos datos';
        return { data: null, error: mensaje, status: 409 };
      }
      logger.error({ err: error }, 'Error al registrar cliente:');
      return { data: null, error: 'Error al registrar cliente', status: 500 };
    }
  },

  /**
   * Login del cliente: valida correo y contraseña (bcrypt) y devuelve el token de sesión.
   */
  async login(correo_electronico: string, contrasenia: string) {
    try {
      const registro = await UsuarioClienteModel.getByCorreo(correo_electronico);
      if (!registro || !registro.usuarioCliente.activo) {
        return { data: null, error: 'Credenciales inválidas', status: 401 };
      }

      const passwordMatch = await comparePassword({
        input: contrasenia,
        hashedInput: registro.usuarioCliente.contrasenia
      });

      if (!passwordMatch) {
        return { data: null, error: 'Credenciales inválidas', status: 401 };
      }

      const token = tokenDeCliente(registro.cliente);
      if (!token) {
        return { data: null, error: 'Error al generar token', status: 500 };
      }

      return {
        data: { cliente: registro.cliente, token, vistas: vistasDe('CLIENTE') },
        error: null,
        status: 200
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al iniciar sesión cliente:');
      return { data: null, error: 'Error al iniciar sesión', status: 500 };
    }
  },

  /**
   * Recuperar contraseña de cliente: Supabase envía un correo con un enlace de un solo uso hacia
   * PASSWORD_RESET_URL_CLIENTE. Siempre responde 202 (anti-enumeración).
   */
  async recuperarContrasenia(correo_electronico: string) {
    try {
      if (!correo_electronico) {
        return { data: null, error: 'Correo electrónico requerido', status: 400 };
      }

      const registro = await UsuarioClienteModel.getByCorreo(correo_electronico);

      if (registro && registro.usuarioCliente.activo && registro.cliente.correo_electronico && supabaseConfigurado()) {
        try {
          await enviarCorreoRecuperacion(registro.cliente.correo_electronico, PASSWORD_RESET_URL_CLIENTE);
        } catch (err) {
          // No se informa al cliente: la respuesta es la misma exista o no la cuenta.
          logger.error({ err, clienteId: registro.cliente.id }, 'No se pudo enviar el correo de recuperación');
        }
      }

      return {
        data: { message: 'Si el correo existe, se envió un enlace de recuperación.' },
        error: null,
        status: 202
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al solicitar recuperación cliente:');
      return { data: null, error: 'Error al procesar la solicitud', status: 500 };
    }
  },

  /**
   * Restablecer contraseña de cliente: valida el token_hash del enlace (un solo uso) y actualiza el hash.
   */
  async restablecerContrasenia(data: { tokenHash: string; nuevaContrasenia: string }) {
    try {
      if (!data.tokenHash || !data.nuevaContrasenia) {
        return { data: null, error: 'tokenHash y nueva contraseña son requeridos', status: 400 };
      }

      let correo: string;
      try {
        correo = await verificarEnlaceRecuperacion(data.tokenHash);
      } catch (err) {
        if (err instanceof SupabaseAuthError && err.codigo === 'enlace_invalido') {
          return { data: null, error: ENLACE_INVALIDO, status: 401 };
        }
        logger.error({ err }, 'Error al validar el enlace de recuperación del cliente');
        return { data: null, error: 'Servicio de verificación no disponible. Intenta más tarde.', status: 503 };
      }

      const registro = await UsuarioClienteModel.getByCorreo(correo);
      if (!registro || !registro.usuarioCliente.activo) {
        return { data: null, error: ENLACE_INVALIDO, status: 401 };
      }

      const clienteId = Number(registro.cliente.id);
      const hash = await hashPassword(data.nuevaContrasenia);
      const ok = await UsuarioClienteModel.updateContrasenia(clienteId, hash);

      if (!ok) {
        return { data: null, error: 'No se pudo actualizar la contraseña', status: 500 };
      }
      // Cambiar la contraseña invalida las sesiones abiertas con la anterior
      await revocarSesionesDe('cliente', clienteId);

      return { data: { message: 'Contraseña actualizada exitosamente' }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al restablecer contraseña cliente:');
      return { data: null, error: 'Error al restablecer la contraseña', status: 500 };
    }
  },

  async logout(user: DecodedToken) {
    await revocarToken(user.jti, user.exp);
    return { data: { message: 'Sesión cerrada exitosamente' }, error: null, status: 200 };
  },

  async me(token: string) {
    try {
      const decoded = getInfoToToken(token);
      if (!decoded || !decoded.id) {
        return { data: null, error: 'Token inválido o expirado', status: 401 };
      }

      const cliente = await ClienteModel.getById(Number(decoded.id));
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }

      return { data: { ...cliente, vistas: vistasDe('CLIENTE') }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al obtener perfil de cliente:');
      return { data: null, error: 'Error al obtener datos del cliente', status: 500 };
    }
  }
};
