import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword, hassPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { generarCodigo, guardarCodigo, verificarCodigo as verificarOtp, puedeGenerarCodigo } from '../services/otp.service.js';
import { enviarCodigo } from '../services/notificarCodigo.service.js';
import { IS_PROD } from '../config.js';
import logger from '../config/logger.js';

const OTP_SCOPE_LOGIN = 'login' as const;
const OTP_SCOPE_RESET = 'reset' as const;

export const AuthController = {
  /**
   * Paso 1 del login: valida contraseña y responde 202 con tmpToken + envío de código OTP.
   * El token de sesión se emite solo en verificarCodigo().
   */
  async login(usuario: string, contrasenia: string) {
    if (!usuario || !contrasenia) {
      return { data: null, error: 'Usuario y contraseña requeridos', status: 400 };
    }

    const user = await UsuarioModel.getByUsuario(usuario);

    if (!user) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const isValid = await comparePassword({ input: contrasenia, hashedInput: user.contrasenia ?? '' });

    if (!isValid) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const puedeEnviar = await puedeGenerarCodigo('usuario', Number(user.id));
    if (!puedeEnviar) {
      return { data: null, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.', status: 429 };
    }

    const codigo = generarCodigo();
    const guardado = await guardarCodigo(OTP_SCOPE_LOGIN, 'usuario', Number(user.id), codigo);

    if (!guardado) {
      // Redis caído: en prod falla cerrado (503); en dev degrada a login simple
      if (IS_PROD) {
        logger.error({ userId: user.id }, 'Redis no disponible en producción; login bloqueado');
        return { data: null, error: 'Servicio de verificación no disponible. Intenta más tarde.', status: 503 };
      }
      logger.warn({ userId: user.id }, 'Redis no disponible; login sin 2FA (degradado)');
      const token = generarToken({ id: user.id, usuario: user.usuario, rol: user.rol });
      if (!token) {
        return { data: null, error: 'Error al generar token', status: 500 };
      }
      const { contrasenia: _, ...userWithoutPassword } = user;
      return { data: { usuario: userWithoutPassword, token, twoFactor: false }, error: null, status: 200 };
    }

    const canal = await enviarCodigo(
      { telefono: user.telefono, correo: user.correo_electronico },
      codigo,
      'login'
    );

    if (!canal) {
      return { data: null, error: 'No se pudo enviar el código de verificación', status: 502 };
    }

    const tmpToken = generarToken(
      { id: user.id, usuario: user.usuario, rol: user.rol, purpose: '2fa' },
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
  },

  /**
   * Paso 2 del login: verifica el código OTP y emite el token de sesión.
   */
  async verificarCodigo(tmpToken: string, codigo: string) {
    if (!tmpToken || !codigo) {
      return { data: null, error: 'tmpToken y código son requeridos', status: 400 };
    }

    let decoded;
    try {
      decoded = getInfoToToken(tmpToken);
    } catch {
      return { data: null, error: 'Token temporal inválido o expirado', status: 401 };
    }

    if (!decoded || decoded.purpose !== '2fa' || !decoded.id) {
      return { data: null, error: 'Token temporal inválido o expirado', status: 401 };
    }

    const userId = Number(decoded.id);
    const verdict = await verificarOtp(OTP_SCOPE_LOGIN, 'usuario', userId, codigo);

    if (verdict !== 'ok') {
      const mensajes: Record<string, string> = {
        invalido: 'Código incorrecto',
        expirado: 'Código expirado. Solicita uno nuevo.',
        agotado: 'Demasiados intentos fallidos. Solicita un código nuevo.'
      };
      return { data: null, error: mensajes[verdict] ?? 'Código inválido', status: 401 };
    }

    const token = generarToken({ id: decoded.id, usuario: decoded.usuario, rol: decoded.rol });
    if (!token) {
      return { data: null, error: 'Error al generar token', status: 500 };
    }

    const user = await UsuarioModel.getById(userId);
    if (!user) {
      return { data: null, error: 'Usuario no encontrado', status: 404 };
    }

    return { data: { usuario: user, token }, error: null, status: 200 };
  },

  /**
   * Recuperar contraseña: envía código OTP al usuario (scope reset).
   * Siempre responde 202 (anti-enumeración).
   */
  async recuperarContrasenia(identificador: string) {
    if (!identificador) {
      return { data: null, error: 'Usuario o correo requerido', status: 400 };
    }

    const user = await UsuarioModel.getByUsuarioOrCorreo(identificador);

    if (user) {
      const puedeEnviar = await puedeGenerarCodigo('usuario', Number(user.id));
      if (puedeEnviar) {
        const codigo = generarCodigo();
        const guardado = await guardarCodigo(OTP_SCOPE_RESET, 'usuario', Number(user.id), codigo);
        if (guardado) {
          await enviarCodigo(
            { telefono: user.telefono, correo: user.correo_electronico },
            codigo,
            'reset'
          );
        }
      }
    }

    return {
      data: { message: 'Si el usuario existe, se envió un código de recuperación.' },
      error: null,
      status: 202
    };
  },

  /**
   * Restablecer contraseña: verifica el código OTP (scope reset) y actualiza.
   */
  async restablecerContrasenia(data: { identificador: string; codigo: string; nuevaContrasenia: string }) {
    if (!data.identificador || !data.codigo || !data.nuevaContrasenia) {
      return { data: null, error: 'identificador, código y nueva contraseña son requeridos', status: 400 };
    }

    const user = await UsuarioModel.getByUsuarioOrCorreo(data.identificador);
    if (!user) {
      return { data: null, error: 'Código incorrecto o expirado', status: 401 };
    }

    const verdict = await verificarOtp(OTP_SCOPE_RESET, 'usuario', Number(user.id), data.codigo);
    if (verdict !== 'ok') {
      const mensajes: Record<string, string> = {
        invalido: 'Código incorrecto',
        expirado: 'Código expirado. Solicita uno nuevo.',
        agotado: 'Demasiados intentos fallidos. Solicita un código nuevo.'
      };
      return { data: null, error: mensajes[verdict] ?? 'Código inválido', status: 401 };
    }

    const hash = await hassPassword(data.nuevaContrasenia);
    await UsuarioModel.update(Number(user.id), { contrasenia: hash });

    return { data: { message: 'Contraseña actualizada exitosamente' }, error: null, status: 200 };
  },

  async logout() {
    return {
      data: { message: 'Sesión cerrada exitosamente' },
      error: null,
      status: 200
    };
  },

  async me(token: string) {
    if (!token) {
      return { data: null, error: 'Token no proporcionado', status: 401 };
    }

    const decoded = getInfoToToken(token);

    if (!decoded) {
      return { data: null, error: 'Token inválido o expirado', status: 401 };
    }

    const usuario = await UsuarioModel.getById(Number(decoded.id));

    if (!usuario) {
      return { data: null, error: 'Usuario no encontrado', status: 404 };
    }

    return { data: usuario, error: null, status: 200 };
  }
};
