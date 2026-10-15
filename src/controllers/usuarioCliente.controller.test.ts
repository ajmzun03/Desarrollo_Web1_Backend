import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../model/supabase/usuarioCliente.model.js', () => ({
  UsuarioClienteModel: {
    getByCorreo: vi.fn(),
    create: vi.fn(),
    updateContrasenia: vi.fn(),
  },
}));
vi.mock('../model/supabase/cliente.model.js', () => ({
  ClienteModel: { getById: vi.fn() },
}));
vi.mock('../utils/hashPassword.js', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
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

import { UsuarioClienteController } from './usuarioCliente.controller.js';
import { UsuarioClienteModel } from '../model/supabase/usuarioCliente.model.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { generarCodigo, guardarCodigo, verificarCodigo, puedeGenerarCodigo } from '../services/otp.service.js';
import { enviarCodigo } from '../services/notificarCodigo.service.js';

const mockUC = vi.mocked(UsuarioClienteModel, true);
const mockCompare = vi.mocked(comparePassword, true);
const mockHash = vi.mocked(hashPassword, true);
const mockGenToken = vi.mocked(generarToken, true);
const mockGetInfo = vi.mocked(getInfoToToken, true);
const mockGenCodigo = vi.mocked(generarCodigo, true);
const mockGuardar = vi.mocked(guardarCodigo, true);
const mockVerificar = vi.mocked(verificarCodigo, true);
const mockPuede = vi.mocked(puedeGenerarCodigo, true);
const mockEnviar = vi.mocked(enviarCodigo, true);

const registroBase = {
  cliente: { id: 10, correo_electronico: 'cli@x.com', telefono: '55559999' },
  usuarioCliente: { id: 1, cliente_id: 10, contrasenia: 'hash', activo: true },
};

describe('UsuarioClienteController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('login (paso 1)', () => {
    it('devuelve 401 si no existe el correo', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      const r = await UsuarioClienteController.login('no@existe.com', 'pass');
      expect(r.status).toBe(401);
    });

    it('devuelve 401 si la contraseña es incorrecta', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockCompare.mockResolvedValueOnce(false);
      const r = await UsuarioClienteController.login('cli@x.com', 'mala');
      expect(r.status).toBe(401);
    });

    it('devuelve 202 con tmpToken cuando todo va bien', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('123456');
      mockGuardar.mockResolvedValueOnce(true);
      mockEnviar.mockResolvedValueOnce('sms');
      mockGenToken.mockReturnValueOnce('tmp.jwt');

      const r = await UsuarioClienteController.login('cli@x.com', 'buena');
      expect(r.status).toBe(202);
      expect((r.data as any).requiereVerificacion).toBe(true);
      expect((r.data as any).tmpToken).toBe('tmp.jwt');
    });

    it('degrada a 200 con twoFactor:false si Redis falla', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('123456');
      mockGuardar.mockResolvedValueOnce(false);
      mockGenToken.mockReturnValueOnce('session.jwt');

      const r = await UsuarioClienteController.login('cli@x.com', 'buena');
      expect(r.status).toBe(200);
      expect((r.data as any).twoFactor).toBe(false);
    });
  });

  describe('verificarCodigo (paso 2)', () => {
    it('devuelve 401 si el tmpToken no es de cliente', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '10', purpose: '2fa' } as never); // sin tipo cliente
      const r = await UsuarioClienteController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(401);
    });

    it('devuelve 200 con token al verificar bien', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '10', correo_electronico: 'cli@x.com', rol: 'CLIENTE', tipo: 'cliente', purpose: '2fa' } as never);
      mockVerificar.mockResolvedValueOnce('ok');
      mockGenToken.mockReturnValueOnce('session.jwt');
      const { ClienteModel } = await import('../model/supabase/cliente.model.js');
      vi.mocked(ClienteModel.getById).mockResolvedValueOnce({ id: 10 } as never);

      const r = await UsuarioClienteController.verificarCodigo('tmp', '123456');
      expect(r.status).toBe(200);
      expect((r.data as any).token).toBe('session.jwt');
    });

    it('devuelve 401 si el código es incorrecto', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '10', tipo: 'cliente', purpose: '2fa' } as never);
      mockVerificar.mockResolvedValueOnce('invalido');
      const r = await UsuarioClienteController.verificarCodigo('tmp', '000000');
      expect(r.status).toBe(401);
    });
  });

  describe('recuperarContrasenia', () => {
    it('siempre responde 202 aunque el correo no exista', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      const r = await UsuarioClienteController.recuperarContrasenia('no@existe.com');
      expect(r.status).toBe(202);
    });

    it('responde 202 y envía código si el correo existe', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockPuede.mockResolvedValueOnce(true);
      mockGenCodigo.mockReturnValueOnce('654321');
      mockGuardar.mockResolvedValueOnce(true);
      mockEnviar.mockResolvedValueOnce('email');

      const r = await UsuarioClienteController.recuperarContrasenia('cli@x.com');
      expect(r.status).toBe(202);
      expect(mockEnviar).toHaveBeenCalled();
    });
  });

  describe('restablecerContrasenia', () => {
    it('devuelve 401 si el código es inválido', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockVerificar.mockResolvedValueOnce('agotado');
      const r = await UsuarioClienteController.restablecerContrasenia({
        correo_electronico: 'cli@x.com', codigo: '000000', nuevaContrasenia: 'nuevapass1'
      });
      expect(r.status).toBe(401);
    });

    it('actualiza la contraseña si el código es ok', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockVerificar.mockResolvedValueOnce('ok');
      mockHash.mockResolvedValueOnce('nuevo.hash' as never);
      mockUC.updateContrasenia.mockResolvedValueOnce(true);

      const r = await UsuarioClienteController.restablecerContrasenia({
        correo_electronico: 'cli@x.com', codigo: '123456', nuevaContrasenia: 'nuevapass1'
      });
      expect(r.status).toBe(200);
      expect(mockUC.updateContrasenia).toHaveBeenCalledWith(10, 'nuevo.hash');
    });
  });
});
