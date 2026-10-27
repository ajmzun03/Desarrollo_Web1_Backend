import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/sesiones.service.js', () => ({
  revocarToken: vi.fn().mockResolvedValue(true),
  revocarSesionesDe: vi.fn().mockResolvedValue(true),
  estaRevocado: vi.fn().mockResolvedValue(false),
}));

vi.mock('../model/supabase/usuario.model.js', () => ({
  UsuarioModel: {
    getByUsuario: vi.fn(),
    getByUsuarioOrCorreo: vi.fn(),
    getByCorreo: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../utils/hashPassword.js', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));
vi.mock('../utils/generateToken.js', () => ({
  generarToken: vi.fn(),
  getInfoToToken: vi.fn(),
}));
vi.mock('../config.js', () => ({
  PASSWORD_RESET_URL_STAFF: 'http://localhost:5173/copac/restablecer',
}));

// Se conserva SupabaseAuthError real (el controlador distingue por clase y código); el resto se simula
vi.mock('../services/supabaseAuth.service.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/supabaseAuth.service.js')>()),
  supabaseConfigurado: vi.fn(),
  abrirSesion: vi.fn(),
  factorVerificado: vi.fn(),
  enrolarTotp: vi.fn(),
  verificarCodigoTotp: vi.fn(),
  cerrarSesion: vi.fn(),
  reiniciarMfa: vi.fn(),
  enviarCorreoRecuperacion: vi.fn(),
  verificarEnlaceRecuperacion: vi.fn(),
}));
vi.mock('../services/mfaPendiente.service.js', () => ({
  MAX_INTENTOS: 5,
  almacenDisponible: vi.fn(),
  nuevoId: vi.fn(),
  guardar: vi.fn(),
  obtener: vi.fn(),
  actualizar: vi.fn(),
  destruir: vi.fn(),
  registrarIntentoFallido: vi.fn(),
}));

import { AuthController } from './auth.controller.js';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { revocarSesionesDe } from '../services/sesiones.service.js';
import * as supa from '../services/supabaseAuth.service.js';
import * as pend from '../services/mfaPendiente.service.js';

const mockUsuario = vi.mocked(UsuarioModel, true);
const mockCompare = vi.mocked(comparePassword, true);
const mockHash = vi.mocked(hashPassword, true);
const mockGenToken = vi.mocked(generarToken, true);
const mockGetInfo = vi.mocked(getInfoToToken, true);
const mockRevocar = vi.mocked(revocarSesionesDe, true);
const s = vi.mocked(supa, true);
const p = vi.mocked(pend, true);

const userBase = {
  id: 1,
  usuario: 'admin.mc',
  correo_electronico: 'admin@mc.com',
  telefono: '55551234',
  contrasenia: 'hash',
  rol: 'ADMIN',
  activo: true,
};
const sesionSupabase = { accessToken: 'acc', refreshToken: 'ref' };
const tokenTemporal = { id: '1', usuario: 'admin.mc', rol: 'ADMIN', purpose: '2fa', sid: 'sid-1' };
const pendienteBase = { usuarioId: 1, sesion: sesionSupabase, mfa: 'verificar' as const, factorId: 'factor-1' };

describe('AuthController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    s.supabaseConfigurado.mockReturnValue(true);
    p.almacenDisponible.mockReturnValue(true);
    p.nuevoId.mockReturnValue('sid-1');
    p.guardar.mockResolvedValue(true);
  });

  describe('login (paso 1)', () => {
    const credencialesValidas = () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(true);
    };

    it('devuelve 400 si faltan credenciales', async () => {
      expect((await AuthController.login('', '')).status).toBe(400);
    });

    it('devuelve 401 si el usuario no existe', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(null);
      expect((await AuthController.login('noexiste', 'pass1234')).status).toBe(401);
    });

    it('devuelve 401 si el usuario está desactivado', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce({ ...userBase, activo: false } as never);
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(401);
    });

    it('devuelve 401 si la contraseña es incorrecta y no toca Supabase', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(false);
      const r = await AuthController.login('admin.mc', 'mala');
      expect(r.status).toBe(401);
      expect(s.abrirSesion).not.toHaveBeenCalled();
    });

    it('devuelve 409 si el usuario no tiene correo', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce({ ...userBase, correo_electronico: null } as never);
      mockCompare.mockResolvedValueOnce(true);
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(409);
    });

    it('devuelve 503 si Supabase no está configurado', async () => {
      credencialesValidas();
      s.supabaseConfigurado.mockReturnValue(false);
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(503);
    });

    it('devuelve 503 si no hay dónde guardar la sesión pendiente (Redis caído en producción)', async () => {
      credencialesValidas();
      p.almacenDisponible.mockReturnValue(false);
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(503);
    });

    it('devuelve 202 con mfa "verificar" cuando el usuario ya tiene autenticador', async () => {
      credencialesValidas();
      s.abrirSesion.mockResolvedValueOnce(sesionSupabase);
      s.factorVerificado.mockResolvedValueOnce('factor-1');
      mockGenToken.mockReturnValueOnce('tmp.jwt.token');

      const r = await AuthController.login('admin.mc', 'buena');

      expect(r.status).toBe(202);
      expect(r.data).toEqual({ requiereVerificacion: true, mfa: 'verificar', tmpToken: 'tmp.jwt.token' });
      expect(s.abrirSesion).toHaveBeenCalledWith('admin@mc.com');
      expect(p.guardar).toHaveBeenCalledWith('sid-1', expect.objectContaining({ usuarioId: 1, mfa: 'verificar', factorId: 'factor-1' }));
      // el tmpToken lleva el id de la sesión pendiente, nunca la sesión de Supabase
      const llamada = mockGenToken.mock.calls[0]!;
      const payload = llamada[0] as Record<string, unknown>;
      expect(payload).toMatchObject({ purpose: '2fa', sid: 'sid-1' });
      expect(JSON.stringify(payload)).not.toContain('acc');
      expect(llamada[1]).toBe('10m');
    });

    it('devuelve 202 con mfa "enrolar" la primera vez (sin factor verificado)', async () => {
      credencialesValidas();
      s.abrirSesion.mockResolvedValueOnce(sesionSupabase);
      s.factorVerificado.mockResolvedValueOnce(null);
      mockGenToken.mockReturnValueOnce('tmp.jwt.token');

      const r = await AuthController.login('admin.mc', 'buena');

      expect(r.status).toBe(202);
      expect(r.data).toMatchObject({ mfa: 'enrolar' });
      expect(p.guardar).toHaveBeenCalledWith('sid-1', expect.not.objectContaining({ factorId: expect.anything() }));
    });

    it('devuelve 503 si Supabase falla al abrir la sesión', async () => {
      credencialesValidas();
      s.abrirSesion.mockRejectedValueOnce(new supa.SupabaseAuthError('caído', 'servicio'));
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(503);
    });

    it('devuelve 429 si Supabase aplica su límite de solicitudes', async () => {
      credencialesValidas();
      s.abrirSesion.mockRejectedValueOnce(new supa.SupabaseAuthError('límite', 'limite'));
      expect((await AuthController.login('admin.mc', 'buena')).status).toBe(429);
    });

    it('cierra la sesión de Supabase si no se pudo guardar el estado pendiente', async () => {
      credencialesValidas();
      s.abrirSesion.mockResolvedValueOnce(sesionSupabase);
      s.factorVerificado.mockResolvedValueOnce('factor-1');
      p.guardar.mockResolvedValueOnce(false);
      const r = await AuthController.login('admin.mc', 'buena');
      expect(r.status).toBe(503);
      expect(s.cerrarSesion).toHaveBeenCalledWith(sesionSupabase);
    });

    it('limpia lo creado si no se puede firmar el tmpToken', async () => {
      credencialesValidas();
      s.abrirSesion.mockResolvedValueOnce(sesionSupabase);
      s.factorVerificado.mockResolvedValueOnce('factor-1');
      mockGenToken.mockReturnValueOnce(undefined);
      const r = await AuthController.login('admin.mc', 'buena');
      expect(r.status).toBe(500);
      expect(p.destruir).toHaveBeenCalledWith('sid-1');
    });
  });

  describe('enrolarMfa', () => {
    it('devuelve 401 si el tmpToken no tiene purpose 2fa', async () => {
      mockGetInfo.mockReturnValueOnce({ ...tokenTemporal, purpose: undefined } as never);
      expect((await AuthController.enrolarMfa('tmp')).status).toBe(401);
    });

    it('devuelve 401 si el tmpToken es inválido o expiró', async () => {
      mockGetInfo.mockImplementationOnce(() => { throw new Error('jwt expired'); });
      expect((await AuthController.enrolarMfa('tmp')).status).toBe(401);
    });

    it('devuelve 401 si la sesión pendiente venció', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce(null);
      expect((await AuthController.enrolarMfa('tmp')).status).toBe(401);
    });

    it('devuelve 401 si la sesión pendiente es de otro usuario', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce({ ...pendienteBase, usuarioId: 99 });
      expect((await AuthController.enrolarMfa('tmp')).status).toBe(401);
    });

    it('devuelve 409 si el usuario ya tiene un autenticador', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce(pendienteBase);
      const r = await AuthController.enrolarMfa('tmp');
      expect(r.status).toBe(409);
      expect(s.enrolarTotp).not.toHaveBeenCalled();
    });

    it('devuelve el QR y guarda el factor recién creado', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce({ usuarioId: 1, sesion: sesionSupabase, mfa: 'enrolar' });
      s.enrolarTotp.mockResolvedValueOnce({ factorId: 'f-nuevo', qrCode: 'data:image/svg+xml;utf8,<svg/>', secret: 'ABC123', uri: 'otpauth://totp/x' });

      const r = await AuthController.enrolarMfa('tmp');

      expect(r.status).toBe(200);
      expect(r.data).toEqual({ qrCode: 'data:image/svg+xml;utf8,<svg/>', secret: 'ABC123', uri: 'otpauth://totp/x' });
      expect(p.actualizar).toHaveBeenCalledWith('sid-1', expect.objectContaining({ factorId: 'f-nuevo', mfa: 'enrolar' }));
    });

    it('devuelve 503 si Supabase falla al crear el factor', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce({ usuarioId: 1, sesion: sesionSupabase, mfa: 'enrolar' });
      s.enrolarTotp.mockRejectedValueOnce(new supa.SupabaseAuthError('caído', 'servicio'));
      expect((await AuthController.enrolarMfa('tmp')).status).toBe(503);
    });
  });

  describe('verificarCodigo (paso 2)', () => {
    const sesionValida = () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce(pendienteBase);
    };

    it('devuelve 400 si faltan datos', async () => {
      expect((await AuthController.verificarCodigo('', '')).status).toBe(400);
    });

    it('devuelve 401 si el tmpToken no tiene purpose 2fa', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '1' } as never);
      expect((await AuthController.verificarCodigo('tmp', '123456')).status).toBe(401);
    });

    it('devuelve 401 si la sesión pendiente venció', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce(null);
      expect((await AuthController.verificarCodigo('tmp', '123456')).status).toBe(401);
    });

    it('devuelve 409 si aún no configuró el autenticador', async () => {
      mockGetInfo.mockReturnValueOnce(tokenTemporal as never);
      p.obtener.mockResolvedValueOnce({ usuarioId: 1, sesion: sesionSupabase, mfa: 'enrolar' });
      expect((await AuthController.verificarCodigo('tmp', '123456')).status).toBe(409);
    });

    it('devuelve 401 con código incorrecto y cuenta el intento', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockRejectedValueOnce(new supa.SupabaseAuthError('mal', 'codigo_invalido'));
      p.registrarIntentoFallido.mockResolvedValueOnce(1);

      const r = await AuthController.verificarCodigo('tmp', '000000');

      expect(r.status).toBe(401);
      expect(p.registrarIntentoFallido).toHaveBeenCalledWith('sid-1');
      expect(p.destruir).not.toHaveBeenCalled();
    });

    it('destruye la sesión pendiente al llegar a 5 códigos incorrectos', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockRejectedValueOnce(new supa.SupabaseAuthError('mal', 'codigo_invalido'));
      p.registrarIntentoFallido.mockResolvedValueOnce(5);

      const r = await AuthController.verificarCodigo('tmp', '000000');

      expect(r.status).toBe(429);
      expect(p.destruir).toHaveBeenCalledWith('sid-1');
      expect(s.cerrarSesion).toHaveBeenCalledWith(sesionSupabase);
    });

    it('devuelve 401 "sesión vencida" si Supabase ya revocó la sesión intermedia', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockRejectedValueOnce(new supa.SupabaseAuthError('revocada', 'sesion_invalida'));
      const r = await AuthController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(401);
      expect(r.error).toMatch(/venci/);
      expect(p.registrarIntentoFallido).not.toHaveBeenCalled();
    });

    it('devuelve 503 si Supabase falla (no cuenta como intento)', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockRejectedValueOnce(new supa.SupabaseAuthError('caído', 'servicio'));
      const r = await AuthController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(503);
      expect(p.registrarIntentoFallido).not.toHaveBeenCalled();
    });

    it('devuelve 200 con token de sesión y vistas al verificar bien', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockResolvedValueOnce();
      mockUsuario.getById.mockResolvedValueOnce({ id: 1, usuario: 'admin.mc', rol: 'ADMIN', activo: true } as never);
      mockGenToken.mockReturnValueOnce('session.jwt');

      const r = await AuthController.verificarCodigo('tmp', '123456');

      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ token: 'session.jwt' });
      expect(s.verificarCodigoTotp).toHaveBeenCalledWith(sesionSupabase, 'factor-1', '123456');
      expect(p.destruir).toHaveBeenCalledWith('sid-1');
    });

    it('rechaza a un usuario desactivado después de verificar el código', async () => {
      sesionValida();
      s.verificarCodigoTotp.mockResolvedValueOnce();
      mockUsuario.getById.mockResolvedValueOnce({ id: 1, rol: 'ADMIN', activo: false } as never);
      expect((await AuthController.verificarCodigo('tmp', '123456')).status).toBe(401);
    });
  });

  describe('recuperarContrasenia', () => {
    it('devuelve 400 si no hay identificador', async () => {
      expect((await AuthController.recuperarContrasenia('')).status).toBe(400);
    });

    it('siempre responde 202 aunque el usuario no exista, sin enviar correo', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(null);
      const r = await AuthController.recuperarContrasenia('fantasma');
      expect(r.status).toBe(202);
      expect(s.enviarCorreoRecuperacion).not.toHaveBeenCalled();
    });

    it('envía el correo de recuperación al correo del usuario', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(userBase as never);
      const r = await AuthController.recuperarContrasenia('admin.mc');
      expect(r.status).toBe(202);
      expect(s.enviarCorreoRecuperacion).toHaveBeenCalledWith('admin@mc.com', 'http://localhost:5173/copac/restablecer');
    });

    it('responde 202 igualmente si falla el envío (no revela nada)', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(userBase as never);
      s.enviarCorreoRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('smtp', 'servicio'));
      expect((await AuthController.recuperarContrasenia('admin.mc')).status).toBe(202);
    });

    it('no envía correo a un usuario desactivado', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce({ ...userBase, activo: false } as never);
      await AuthController.recuperarContrasenia('admin.mc');
      expect(s.enviarCorreoRecuperacion).not.toHaveBeenCalled();
    });
  });

  describe('restablecerContrasenia', () => {
    const datos = { tokenHash: 'hash-del-enlace', nuevaContrasenia: 'nueva-clave-1' };

    it('devuelve 401 si el enlace es inválido, vencido o ya usado', async () => {
      s.verificarEnlaceRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('x', 'enlace_invalido'));
      expect((await AuthController.restablecerContrasenia(datos)).status).toBe(401);
      expect(mockUsuario.update).not.toHaveBeenCalled();
    });

    it('devuelve 503 si Supabase falla al validar el enlace', async () => {
      s.verificarEnlaceRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('x', 'servicio'));
      expect((await AuthController.restablecerContrasenia(datos)).status).toBe(503);
    });

    it('devuelve 401 si el correo verificado no pertenece a ningún usuario activo', async () => {
      s.verificarEnlaceRecuperacion.mockResolvedValueOnce('nadie@mc.com');
      mockUsuario.getByCorreo.mockResolvedValueOnce(null);
      expect((await AuthController.restablecerContrasenia(datos)).status).toBe(401);
    });

    it('actualiza el hash, cierra las sesiones y NO toca el autenticador', async () => {
      s.verificarEnlaceRecuperacion.mockResolvedValueOnce('admin@mc.com');
      mockUsuario.getByCorreo.mockResolvedValueOnce(userBase as never);
      mockHash.mockResolvedValueOnce('nuevo-hash');

      const r = await AuthController.restablecerContrasenia(datos);

      expect(r.status).toBe(200);
      expect(mockUsuario.update).toHaveBeenCalledWith(1, { contrasenia: 'nuevo-hash' });
      expect(mockRevocar).toHaveBeenCalledWith('usuario', 1);
      expect(s.reiniciarMfa).not.toHaveBeenCalled();
    });
  });

  describe('reiniciarMfaDeUsuario', () => {
    it('devuelve 404 si el usuario no existe', async () => {
      mockUsuario.getById.mockResolvedValueOnce(null);
      expect((await AuthController.reiniciarMfaDeUsuario(9)).status).toBe(404);
    });

    it('devuelve 409 si el usuario no tiene correo', async () => {
      mockUsuario.getById.mockResolvedValueOnce({ ...userBase, correo_electronico: null } as never);
      expect((await AuthController.reiniciarMfaDeUsuario(1)).status).toBe(409);
    });

    it('elimina los factores y cierra las sesiones del usuario', async () => {
      mockUsuario.getById.mockResolvedValueOnce(userBase as never);
      s.reiniciarMfa.mockResolvedValueOnce(1);

      const r = await AuthController.reiniciarMfaDeUsuario(1);

      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ factoresEliminados: 1 });
      expect(s.reiniciarMfa).toHaveBeenCalledWith('admin@mc.com');
      expect(mockRevocar).toHaveBeenCalledWith('usuario', 1);
    });

    it('devuelve 503 si Supabase falla', async () => {
      mockUsuario.getById.mockResolvedValueOnce(userBase as never);
      s.reiniciarMfa.mockRejectedValueOnce(new supa.SupabaseAuthError('x', 'servicio'));
      expect((await AuthController.reiniciarMfaDeUsuario(1)).status).toBe(503);
      expect(mockRevocar).not.toHaveBeenCalled();
    });
  });
});
