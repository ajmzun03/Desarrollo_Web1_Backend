import { UsuarioClienteModel } from '../model/supabase/usuarioCliente.model.js';
import { ClienteModel } from '../model/supabase/cliente.model.js';
import { hassPassword, comparePassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { generarCodigo, guardarCodigo, verificarCodigo as verificarOtp, puedeGenerarCodigo } from '../services/otp.service.js';
import { enviarCodigo } from '../services/notificarCodigo.service.js';
import { IS_PROD } from '../config.js';
import logger from '../config/logger.js';

const OTP_SCOPE_LOGIN = 'login' as const;
const OTP_SCOPE_RESET = 'reset' as const;

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

      const hashedPassword = await hassPassword(data.contrasenia);
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

      const token = generarToken({
        id: Number(resultado.cliente.id),
        correo_electronico: resultado.cliente.correo_electronico,
        rol: 'CLIENTE',
        tipo: 'cliente'
      });

      return {
        data: {
          cliente: resultado.cliente,
          token
        },
        error: null,
        status: 201
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al registrar cliente:');
      return { data: null, error: 'Error al registrar cliente', status: 500 };
    }
  },

  /**
   * Paso 1 del login cliente: valida contraseña y envía código 2FA.
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

      const clienteId = Number(registro.cliente.id);
      const puedeEnviar = await puedeGenerarCodigo('cliente', clienteId);
      if (!puedeEnviar) {
        return { data: null, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.', status: 429 };
      }

      const codigo = generarCodigo();
      const guardado = await guardarCodigo(OTP_SCOPE_LOGIN, 'cliente', clienteId, codigo);

      if (!guardado) {
        // Redis caído: en prod falla cerrado (503); en dev degrada a login simple
        if (IS_PROD) {
          logger.error({ clienteId }, 'Redis no disponible en producción; login cliente bloqueado');
          return { data: null, error: 'Servicio de verificación no disponible. Intenta más tarde.', status: 503 };
        }
        logger.warn({ clienteId }, 'Redis no disponible; login cliente sin 2FA (degradado)');
        const token = generarToken({
          id: clienteId,
          correo_electronico: registro.cliente.correo_electronico,
          rol: 'CLIENTE',
          tipo: 'cliente'
        });
        return {
          data: { cliente: registro.cliente, token, twoFactor: false },
          error: null,
          status: 200
        };
      }

      const canal = await enviarCodigo(
        { telefono: registro.cliente.telefono, correo: registro.cliente.correo_electronico },
        codigo,
        'login'
      );

      if (!canal) {
        return { data: null, error: 'No se pudo enviar el código de verificación', status: 502 };
      }

      const tmpToken = generarToken(
        {
          id: clienteId,
          correo_electronico: registro.cliente.correo_electronico,
          rol: 'CLIENTE',
          tipo: 'cliente',
          purpose: '2fa'
        },
        '10m'
      );

      if (!tmpToken) {
        return { data: null, error: 'Error al generar token temporal', status: 500 };
      }

      return {
        data: { requiereVerificacion: true, tmpToken, canal },
        error: null,
        status: 202
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al iniciar sesión cliente:');
      return { data: null, error: 'Error al iniciar sesión', status: 500 };
    }
  },

  /**
   * Paso 2 del login cliente: verifica código OTP y emite token de sesión.
   */
  async verificarCodigo(tmpToken: string, codigo: string) {
    try {
      if (!tmpToken || !codigo) {
        return { data: null, error: 'tmpToken y código son requeridos', status: 400 };
      }

      let decoded;
      try {
        decoded = getInfoToToken(tmpToken);
      } catch {
        return { data: null, error: 'Token temporal inválido o expirado', status: 401 };
      }

      if (!decoded || decoded.purpose !== '2fa' || !decoded.id || decoded.tipo !== 'cliente') {
        return { data: null, error: 'Token temporal inválido o expirado', status: 401 };
      }

      const clienteId = Number(decoded.id);
      const verdict = await verificarOtp(OTP_SCOPE_LOGIN, 'cliente', clienteId, codigo);

      if (verdict !== 'ok') {
        const mensajes: Record<string, string> = {
          invalido: 'Código incorrecto',
          expirado: 'Código expirado. Solicita uno nuevo.',
          agotado: 'Demasiados intentos fallidos. Solicita un código nuevo.'
        };
        return { data: null, error: mensajes[verdict] ?? 'Código inválido', status: 401 };
      }

      const token = generarToken({
        id: decoded.id,
        correo_electronico: decoded.correo_electronico,
        rol: 'CLIENTE',
        tipo: 'cliente'
      });

      const cliente = await ClienteModel.getById(clienteId);
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }

      return { data: { cliente, token }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al verificar código cliente:');
      return { data: null, error: 'Error al verificar el código', status: 500 };
    }
  },

  /**
   * Recuperar contraseña de cliente: envía código OTP al correo.
   * Siempre responde 202 (anti-enumeración).
   */
  async recuperarContrasenia(correo_electronico: string) {
    try {
      if (!correo_electronico) {
        return { data: null, error: 'Correo electrónico requerido', status: 400 };
      }

      const registro = await UsuarioClienteModel.getByCorreo(correo_electronico);

      if (registro && registro.usuarioCliente.activo) {
        const clienteId = Number(registro.cliente.id);
        const puedeEnviar = await puedeGenerarCodigo('cliente', clienteId);
        if (puedeEnviar) {
          const codigo = generarCodigo();
          const guardado = await guardarCodigo(OTP_SCOPE_RESET, 'cliente', clienteId, codigo);
          if (guardado) {
            await enviarCodigo(
              { telefono: registro.cliente.telefono, correo: registro.cliente.correo_electronico },
              codigo,
              'reset'
            );
          }
        }
      }

      return {
        data: { message: 'Si el correo existe, se envió un código de recuperación.' },
        error: null,
        status: 202
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al solicitar recuperación cliente:');
      return { data: null, error: 'Error al procesar la solicitud', status: 500 };
    }
  },

  /**
   * Restablecer contraseña de cliente: verifica código OTP y actualiza.
   */
  async restablecerContrasenia(data: { correo_electronico: string; codigo: string; nuevaContrasenia: string }) {
    try {
      if (!data.correo_electronico || !data.codigo || !data.nuevaContrasenia) {
        return { data: null, error: 'correo, código y nueva contraseña son requeridos', status: 400 };
      }

      const registro = await UsuarioClienteModel.getByCorreo(data.correo_electronico);
      if (!registro) {
        return { data: null, error: 'Código incorrecto o expirado', status: 401 };
      }

      const clienteId = Number(registro.cliente.id);
      const verdict = await verificarOtp(OTP_SCOPE_RESET, 'cliente', clienteId, data.codigo);

      if (verdict !== 'ok') {
        const mensajes: Record<string, string> = {
          invalido: 'Código incorrecto',
          expirado: 'Código expirado. Solicita uno nuevo.',
          agotado: 'Demasiados intentos fallidos. Solicita un código nuevo.'
        };
        return { data: null, error: mensajes[verdict] ?? 'Código inválido', status: 401 };
      }

      const hash = await hassPassword(data.nuevaContrasenia);
      const ok = await UsuarioClienteModel.updateContrasenia(clienteId, hash);

      if (!ok) {
        return { data: null, error: 'No se pudo actualizar la contraseña', status: 500 };
      }

      return { data: { message: 'Contraseña actualizada exitosamente' }, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al restablecer contraseña cliente:');
      return { data: null, error: 'Error al restablecer la contraseña', status: 500 };
    }
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

      return { data: cliente, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al obtener perfil de cliente:');
      return { data: null, error: 'Error al obtener datos del cliente', status: 500 };
    }
  }
};
