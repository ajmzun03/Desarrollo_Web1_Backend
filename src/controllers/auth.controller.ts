import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { PASSWORD_RESET_URL_STAFF } from '../config.js';
import logger from '../config/logger.js';
import { vistasDe } from '../config/vistas.js';
import { revocarToken, revocarSesionesDe } from '../services/sesiones.service.js';
import {
  SupabaseAuthError,
  abrirSesion,
  cerrarSesion,
  enrolarTotp,
  enviarCorreoRecuperacion,
  factorVerificado,
  reiniciarMfa,
  supabaseConfigurado,
  verificarCodigoTotp,
  verificarEnlaceRecuperacion
} from '../services/supabaseAuth.service.js';
import {
  MAX_INTENTOS,
  actualizar,
  almacenDisponible,
  destruir,
  guardar,
  nuevoId,
  obtener,
  registrarIntentoFallido
} from '../services/mfaPendiente.service.js';
import type { DecodedToken } from '../jwt.js';

const SERVICIO_NO_DISPONIBLE = 'Servicio de verificación no disponible. Intenta más tarde.';
const SESION_VENCIDA = 'La sesión de verificación venció. Inicia sesión de nuevo.';
const ENLACE_INVALIDO = 'El enlace es inválido, venció o ya fue usado. Solicita uno nuevo.';

/** Traduce un fallo de Supabase Auth a la respuesta HTTP que corresponde. */
function errorServicio(err: unknown, contexto: string) {
  if (err instanceof SupabaseAuthError && err.codigo === 'sesion_invalida') {
    return { data: null, error: SESION_VENCIDA, status: 401 };
  }
  if (err instanceof SupabaseAuthError && err.codigo === 'limite') {
    return { data: null, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.', status: 429 };
  }
  logger.error({ err }, contexto);
  return { data: null, error: SERVICIO_NO_DISPONIBLE, status: 503 };
}

/** Lee un tmpToken de 2FA y devuelve la sesión pendiente que le corresponde, o null si no vale. */
async function sesionPendiente(tmpToken: string) {
  let decoded: DecodedToken | null = null;
  try {
    decoded = getInfoToToken(tmpToken);
  } catch {
    return null;
  }
  if (!decoded || decoded.purpose !== '2fa' || !decoded.id || !decoded.sid) return null;
  const pendiente = await obtener(decoded.sid);
  if (!pendiente || String(pendiente.usuarioId) !== String(decoded.id)) return null;
  return { decoded, sid: decoded.sid, pendiente };
}

export const AuthController = {
  /**
   * Paso 1 del login: valida usuario y contraseña (bcrypt). Si son correctos abre una sesión interna
   * en Supabase Auth y responde 202 con un tmpToken y el estado del segundo factor:
   *  - mfa = "verificar": el usuario ya tiene autenticador; pide el código.
   *  - mfa = "enrolar":   primera vez; debe escanear un QR (POST /auth/mfa/enrolar).
   * El token de sesión de COPAC se emite solo en verificarCodigo().
   */
  async login(usuario: string, contrasenia: string) {
    if (!usuario || !contrasenia) {
      return { data: null, error: 'Usuario y contraseña requeridos', status: 400 };
    }

    const user = await UsuarioModel.getByUsuario(usuario);

    // Un usuario desactivado no inicia sesión (mismo mensaje para no revelar que existe)
    if (!user || user.activo === false) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const isValid = await comparePassword({ input: contrasenia, hashedInput: user.contrasenia ?? '' });
    if (!isValid) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    if (!user.correo_electronico) {
      return { data: null, error: 'Tu usuario no tiene un correo registrado. Pide a un administrador que lo agregue.', status: 409 };
    }

    // En producción el estado pendiente vive en Redis: sin él no se puede completar el segundo factor.
    if (!supabaseConfigurado() || !almacenDisponible()) {
      logger.error({ userId: user.id }, 'MFA no disponible (Supabase sin configurar o Redis caído); login bloqueado');
      return { data: null, error: SERVICIO_NO_DISPONIBLE, status: 503 };
    }

    let sesion;
    let factorId: string | null;
    try {
      sesion = await abrirSesion(user.correo_electronico);
      factorId = await factorVerificado(sesion);
    } catch (err) {
      return errorServicio(err, 'Error al abrir la sesión de Supabase');
    }

    const sid = nuevoId();
    const mfa = factorId ? 'verificar' : 'enrolar';
    const guardado = await guardar(sid, {
      usuarioId: Number(user.id),
      sesion,
      mfa,
      ...(factorId ? { factorId } : {})
    });
    if (!guardado) {
      await cerrarSesion(sesion);
      return { data: null, error: SERVICIO_NO_DISPONIBLE, status: 503 };
    }

    const tmpToken = generarToken(
      { id: user.id, usuario: user.usuario, rol: user.rol, purpose: '2fa', sid },
      '10m'
    );
    if (!tmpToken) {
      await destruir(sid);
      await cerrarSesion(sesion);
      return { data: null, error: 'Error al generar token temporal', status: 500 };
    }

    return { data: { requiereVerificacion: true, mfa, tmpToken }, error: null, status: 202 };
  },

  /**
   * Primera vez: crea el factor TOTP y devuelve el QR (data URI SVG), el secreto en texto y la URI otpauth.
   */
  async enrolarMfa(tmpToken: string) {
    const contexto = await sesionPendiente(tmpToken);
    if (!contexto) {
      return { data: null, error: SESION_VENCIDA, status: 401 };
    }
    if (contexto.pendiente.mfa === 'verificar' && contexto.pendiente.factorId) {
      return { data: null, error: 'Ya tienes un autenticador configurado. Ingresa el código.', status: 409 };
    }

    try {
      const enrolamiento = await enrolarTotp(contexto.pendiente.sesion);
      await actualizar(contexto.sid, { ...contexto.pendiente, mfa: 'enrolar', factorId: enrolamiento.factorId });
      return {
        data: { qrCode: enrolamiento.qrCode, secret: enrolamiento.secret, uri: enrolamiento.uri },
        error: null,
        status: 200
      };
    } catch (err) {
      return errorServicio(err, 'Error al enrolar el autenticador');
    }
  },

  /**
   * Paso 2 del login: valida el código de 6 dígitos del autenticador. Si Supabase eleva la sesión a aal2,
   * emite el token de COPAC. Tras MAX_INTENTOS códigos incorrectos la sesión pendiente se destruye.
   */
  async verificarCodigo(tmpToken: string, codigo: string) {
    if (!tmpToken || !codigo) {
      return { data: null, error: 'tmpToken y código son requeridos', status: 400 };
    }

    const contexto = await sesionPendiente(tmpToken);
    if (!contexto) {
      return { data: null, error: SESION_VENCIDA, status: 401 };
    }
    const { sid, pendiente } = contexto;

    if (!pendiente.factorId) {
      return { data: null, error: 'Primero configura tu autenticador escaneando el código QR.', status: 409 };
    }

    try {
      await verificarCodigoTotp(pendiente.sesion, pendiente.factorId, codigo);
    } catch (err) {
      if (err instanceof SupabaseAuthError && err.codigo === 'codigo_invalido') {
        const intentos = await registrarIntentoFallido(sid);
        if (intentos >= MAX_INTENTOS) {
          await destruir(sid);
          await cerrarSesion(pendiente.sesion);
          logger.warn({ userId: pendiente.usuarioId }, 'MFA agotado tras intentos fallidos');
          return { data: null, error: 'Demasiados intentos fallidos. Inicia sesión de nuevo.', status: 429 };
        }
        return { data: null, error: 'Código incorrecto', status: 401 };
      }
      return errorServicio(err, 'Error al verificar el código del autenticador');
    }

    const user = await UsuarioModel.getById(pendiente.usuarioId);
    await destruir(sid);
    if (!user) {
      return { data: null, error: 'Usuario no encontrado', status: 404 };
    }
    if (user.activo === false) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const token = generarToken({ id: user.id, usuario: user.usuario, rol: user.rol });
    if (!token) {
      return { data: null, error: 'Error al generar token', status: 500 };
    }

    return { data: { usuario: user, token, vistas: vistasDe(user.rol) }, error: null, status: 200 };
  },

  /**
   * Recuperar contraseña: Supabase envía un correo con un enlace de un solo uso hacia
   * PASSWORD_RESET_URL_STAFF. Siempre responde 202 (anti-enumeración).
   */
  async recuperarContrasenia(identificador: string) {
    if (!identificador) {
      return { data: null, error: 'Usuario o correo requerido', status: 400 };
    }

    const user = await UsuarioModel.getByUsuarioOrCorreo(identificador);

    if (user && user.activo !== false && user.correo_electronico && supabaseConfigurado()) {
      try {
        await enviarCorreoRecuperacion(user.correo_electronico, PASSWORD_RESET_URL_STAFF);
      } catch (err) {
        // No se informa al cliente: la respuesta es la misma exista o no la cuenta.
        logger.error({ err, userId: user.id }, 'No se pudo enviar el correo de recuperación');
      }
    }

    return {
      data: { message: 'Si el usuario existe, se envió un correo con el enlace de recuperación.' },
      error: null,
      status: 202
    };
  },

  /**
   * Restablecer contraseña: valida el token_hash del enlace (un solo uso) y actualiza el hash bcrypt.
   * No quita el autenticador: el siguiente login seguirá pidiendo el código.
   */
  async restablecerContrasenia(data: { tokenHash: string; nuevaContrasenia: string }) {
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
      return errorServicio(err, 'Error al validar el enlace de recuperación');
    }

    const user = await UsuarioModel.getByCorreo(correo);
    if (!user || user.activo === false) {
      return { data: null, error: ENLACE_INVALIDO, status: 401 };
    }

    const hash = await hashPassword(data.nuevaContrasenia);
    await UsuarioModel.update(Number(user.id), { contrasenia: hash });
    // Cambiar la contraseña invalida las sesiones abiertas con la anterior
    await revocarSesionesDe('usuario', Number(user.id));

    return { data: { message: 'Contraseña actualizada exitosamente' }, error: null, status: 200 };
  },

  /**
   * Solo ADMIN. Elimina el autenticador de un usuario que perdió su teléfono: en su próximo login
   * escaneará un QR nuevo. También cierra sus sesiones abiertas.
   */
  async reiniciarMfaDeUsuario(usuarioId: number) {
    const user = await UsuarioModel.getById(usuarioId);
    if (!user) {
      return { data: null, error: 'Usuario no encontrado', status: 404 };
    }
    if (!user.correo_electronico) {
      return { data: null, error: 'El usuario no tiene correo registrado', status: 409 };
    }
    if (!supabaseConfigurado()) {
      return { data: null, error: SERVICIO_NO_DISPONIBLE, status: 503 };
    }

    try {
      const eliminados = await reiniciarMfa(user.correo_electronico);
      await revocarSesionesDe('usuario', usuarioId);
      logger.info({ usuarioId, eliminados }, 'Autenticador reiniciado por un administrador');
      return {
        data: { message: 'Autenticador reiniciado. Deberá configurarlo de nuevo en su próximo inicio de sesión.', factoresEliminados: eliminados },
        error: null,
        status: 200
      };
    } catch (err) {
      return errorServicio(err, 'Error al reiniciar el autenticador');
    }
  },

  async logout(user?: DecodedToken) {
    // Revoca el token actual (jti) hasta su expiración; sin Redis el logout solo es del lado del cliente
    if (user) await revocarToken(user.jti, user.exp);
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

    return { data: { ...usuario, vistas: vistasDe(usuario.rol) }, error: null, status: 200 };
  }
};
