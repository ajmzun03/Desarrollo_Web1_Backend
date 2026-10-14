import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/usuario.model.js', () => ({
  UsuarioModel: {
    getByUsuario: vi.fn(),
    getByUsuarioOrCorreo: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../utils/hashPassword.js', () => ({
  comparePassword: vi.fn(),
  hassPassword: vi.fn(),
}));
vi.mock('../utils/generateToken.js', () => ({
  generarToken: vi.fn(),
  getInfoToToken: vi.fn(),
}));
vi.mock('../services/otp.service.js', () => ({
  generarCodigo: vi.fn(),
  guardarCodigo: vi.fn(),
  verificarCodigo: vi.fn(),
  puedeGenerarCodigo: vi.fn(),
}));
vi.mock('../services/notificarCodigo.service.js', () => ({
  enviarCodigo: vi.fn(),
}));

import { AuthController } from './auth.controller.js';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword, hassPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { generarCodigo, guardarCodigo, verificarCodigo, puedeGenerarCodigo } from '../services/otp.service.js';
import { enviarCodigo } from '../services/notificarCodigo.service.js';

const mockUsuario = vi.mocked(UsuarioModel, true);
const mockCompare = vi.mocked(comparePassword, true);
const mockHash = vi.mocked(hassPassword, true);
const mockGenToken = vi.mocked(generarToken, true);
const mockGetInfo = vi.mocked(getInfoToToken, true);
const mockGenCodigo = vi.mocked(generarCodigo, true);
const mockGuardar = vi.mocked(guardarCodigo, true);
const mockVerificar = vi.mocked(verificarCodigo, true);
const mockPuede = vi.mocked(puedeGenerarCodigo, true);
const mockEnviar = vi.mocked(enviarCodigo, true);

const userBase = {
  id: 1,
  usuario: 'admin.mc',
  correo_electronico: 'admin@mc.com',
  telefono: '55551234',
  contrasenia: 'hash',
  rol: 'ADMIN',
};

describe('AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('login (paso 1)', () => {
    it('devuelve 400 si faltan credenciales', async () => {
      const r = await AuthController.login('', '');
      expect(r.status).toBe(400);
    });

    it('devuelve 401 si el usuario no existe', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(null);
      const r = await AuthController.login('noexiste', 'pass1234');
      expect(r.status).toBe(401);
    });

    it('devuelve 401 si la contraseña es incorrecta', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(false);
      const r = await AuthController.login('admin.mc', 'mala');
      expect(r.status).toBe(401);
    });

    it('devuelve 429 si se superó el rate limit de envíos', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockPuede.mockResolvedValueOnce(false);
      const r = await AuthController.login('admin.mc', 'buena');
      expect(r.status).toBe(429);
    });

    it('devuelve 202 con tmpToken y canal cuando todo va bien', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('123456');
      mockGuardar.mockResolvedValueOnce(true);
      mockEnviar.mockResolvedValueOnce('sms');
      mockGenToken.mockReturnValueOnce('tmp.jwt.token');

      const r = await AuthController.login('admin.mc', 'buena');
      expect(r.status).toBe(202);
      expect((r.data as any).requiereVerificacion).toBe(true);
      expect((r.data as any).tmpToken).toBe('tmp.jwt.token');
      expect((r.data as any).canal).toBe('sms');
    });

    it('degrada a 200 con twoFactor:false si Redis no guarda el OTP', async () => {
      mockUsuario.getByUsuario.mockResolvedValueOnce(userBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('123456');
      mockGuardar.mockResolvedValueOnce(false);
      mockGenToken.mockReturnValueOnce('session.jwt');

      const r = await AuthController.login('admin.mc', 'buena');
      expect(r.status).toBe(200);
      expect((r.data as any).twoFactor).toBe(false);
      expect((r.data as any).token).toBe('session.jwt');
    });
  });

  describe('verificarCodigo (paso 2)', () => {
    it('devuelve 401 si el tmpToken no tiene purpose 2fa', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '1', purpose: 'otra' } as never);
      const r = await AuthController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(401);
    });

    it('devuelve 401 si el código es inválido', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '1', usuario: 'admin.mc', rol: 'ADMIN', purpose: '2fa' } as never);
      mockVerificar.mockResolvedValueOnce('invalido');
      const r = await AuthController.verificarCodigo('tmp', '000000');
      expect(r.status).toBe(401);
      expect(r.error).toContain('incorrecto');
    });

    it('devuelve 200 con token de sesión al verificar bien', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '1', usuario: 'admin.mc', rol: 'ADMIN', purpose: '2fa' } as never);
      mockVerificar.mockResolvedValueOnce('ok');
      mockGenToken.mockReturnValueOnce('session.jwt');
      mockUsuario.getById.mockResolvedValueOnce({ id: 1, usuario: 'admin.mc' } as never);

      const r = await AuthController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(200);
      expect((r.data as any).token).toBe('session.jwt');
    });
  });

  describe('recuperarContrasenia', () => {
    it('siempre responde 202 aunque el usuario no exista', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(null);
      const r = await AuthController.recuperarContrasenia('noexiste');
      expect(r.status).toBe(202);
    });

    it('responde 202 y envía código si el usuario existe', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(userBase as never);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('654321');
      mockGuardar.mockResolvedValueOnce(true);
      mockEnviar.mockResolvedValueOnce('email');

      const r = await AuthController.recuperarContrasenia('admin.mc');
      expect(r.status).toBe(202);
      expect(mockEnviar).toHaveBeenCalled();
    });
  });

  describe('restablecerContrasenia', () => {
    it('devuelve 401 si el código es inválido', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(userBase as never);
      mockVerificar.mockResolvedValueOnce('expirado');
      const r = await AuthController.restablecerContrasenia({
        identificador: 'admin.mc', codigo: '000000', nuevaContrasenia: 'nuevapass1'
      });
      expect(r.status).toBe(401);
      expect(r.error).toContain('expirado');
    });

    it('actualiza la contraseña si el código es ok', async () => {
      mockUsuario.getByUsuarioOrCorreo.mockResolvedValueOnce(userBase as never);
      mockVerificar.mockResolvedValueOnce('ok');
      mockHash.mockResolvedValueOnce('nuevo.hash' as never);
      mockUsuario.update.mockResolvedValueOnce({} as never);

      const r = await AuthController.restablecerContrasenia({
        identificador: 'admin.mc', codigo: '123456', nuevaContrasenia: 'nuevapass1'
      });
      expect(r.status).toBe(200);
      expect(mockUsuario.update).toHaveBeenCalledWith(1, { contrasenia: 'nuevo.hash' });
    });
  });
});
