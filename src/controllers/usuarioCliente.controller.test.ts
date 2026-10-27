import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/sesiones.service.js', () => ({
  revocarToken: vi.fn().mockResolvedValue(true),
  revocarSesionesDe: vi.fn().mockResolvedValue(true),
  estaRevocado: vi.fn().mockResolvedValue(false),
}));

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
vi.mock('../config.js', () => ({
  PASSWORD_RESET_URL_CLIENTE: 'http://localhost:5173/restablecer',
}));
vi.mock('../services/supabaseAuth.service.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/supabaseAuth.service.js')>()),
  supabaseConfigurado: vi.fn(),
  enviarCorreoRecuperacion: vi.fn(),
  verificarEnlaceRecuperacion: vi.fn(),
}));

import { UsuarioClienteController } from './usuarioCliente.controller.js';
import { UsuarioClienteModel } from '../model/supabase/usuarioCliente.model.js';
import { ClienteModel } from '../model/supabase/cliente.model.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import { revocarSesionesDe } from '../services/sesiones.service.js';
import * as supa from '../services/supabaseAuth.service.js';

const mockUC = vi.mocked(UsuarioClienteModel, true);
const mockCliente = vi.mocked(ClienteModel, true);
const mockCompare = vi.mocked(comparePassword, true);
const mockHash = vi.mocked(hashPassword, true);
const mockGenToken = vi.mocked(generarToken, true);
const mockGetInfo = vi.mocked(getInfoToToken, true);
const mockRevocar = vi.mocked(revocarSesionesDe, true);
const s = vi.mocked(supa, true);

const registroBase = {
  cliente: { id: 10, correo_electronico: 'cli@x.com', telefono: '55559999' },
  usuarioCliente: { id: 1, cliente_id: 10, contrasenia: 'hash', activo: true },
};

describe('UsuarioClienteController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    s.supabaseConfigurado.mockReturnValue(true);
  });

  describe('registro', () => {
    const datos = { nombre: 'Ana', apellido: 'López', correo_electronico: 'cli@x.com', telefono: '55559999', contrasenia: 'clave-1234' };

    it('devuelve 409 si ya existe una cuenta con el correo', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      expect((await UsuarioClienteController.registro(datos)).status).toBe(409);
    });

    it('crea la cuenta y devuelve 201 con token (sin segundo factor)', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce('hash-nuevo');
      mockUC.create.mockResolvedValueOnce(registroBase as never);
      mockGenToken.mockReturnValueOnce('cliente.jwt');

      const r = await UsuarioClienteController.registro(datos);

      expect(r.status).toBe(201);
      expect(r.data).toMatchObject({ token: 'cliente.jwt' });
      expect(mockUC.create).toHaveBeenCalledWith(expect.objectContaining({ contrasenia: 'hash-nuevo' }));
    });
  });

  describe('login', () => {
    it('devuelve 401 si no existe el correo', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      expect((await UsuarioClienteController.login('no@x.com', 'pass1234')).status).toBe(401);
    });

    it('devuelve 401 si la cuenta está desactivada', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce({ ...registroBase, usuarioCliente: { ...registroBase.usuarioCliente, activo: false } } as never);
      expect((await UsuarioClienteController.login('cli@x.com', 'buena')).status).toBe(401);
    });

    it('devuelve 401 si la contraseña es incorrecta', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockCompare.mockResolvedValueOnce(false);
      expect((await UsuarioClienteController.login('cli@x.com', 'mala')).status).toBe(401);
    });

    it('devuelve 200 con cliente y token directamente (los clientes no usan segundo factor)', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockCompare.mockResolvedValueOnce(true);
      mockGenToken.mockReturnValueOnce('cliente.jwt');

      const r = await UsuarioClienteController.login('cli@x.com', 'buena');

      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ token: 'cliente.jwt', cliente: registroBase.cliente });
      expect(r.data).not.toHaveProperty('tmpToken');
      expect(r.data).not.toHaveProperty('requiereVerificacion');
      expect(mockGenToken).toHaveBeenCalledWith(expect.objectContaining({ id: 10, tipo: 'cliente', rol: 'CLIENTE' }));
      // Supabase no interviene en el login del cliente
      expect(s.enviarCorreoRecuperacion).not.toHaveBeenCalled();
    });
  });

  describe('recuperarContrasenia', () => {
    it('devuelve 400 si no hay correo', async () => {
      expect((await UsuarioClienteController.recuperarContrasenia('')).status).toBe(400);
    });

    it('siempre responde 202 aunque el correo no exista, sin enviar nada', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      const r = await UsuarioClienteController.recuperarContrasenia('no@x.com');
      expect(r.status).toBe(202);
      expect(s.enviarCorreoRecuperacion).not.toHaveBeenCalled();
    });

    it('envía el correo de recuperación hacia la pantalla del portal', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      const r = await UsuarioClienteController.recuperarContrasenia('cli@x.com');
      expect(r.status).toBe(202);
      expect(s.enviarCorreoRecuperacion).toHaveBeenCalledWith('cli@x.com', 'http://localhost:5173/restablecer');
    });

    it('responde 202 igualmente si falla el envío', async () => {
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      s.enviarCorreoRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('smtp', 'servicio'));
      expect((await UsuarioClienteController.recuperarContrasenia('cli@x.com')).status).toBe(202);
    });
  });

  describe('restablecerContrasenia', () => {
    const datos = { tokenHash: 'hash-del-enlace', nuevaContrasenia: 'nueva-clave-1' };

    it('devuelve 401 si el enlace es inválido, vencido o ya usado', async () => {
      s.verificarEnlaceRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('x', 'enlace_invalido'));
      expect((await UsuarioClienteController.restablecerContrasenia(datos)).status).toBe(401);
      expect(mockUC.updateContrasenia).not.toHaveBeenCalled();
    });

    it('devuelve 503 si Supabase falla al validar el enlace', async () => {
      s.verificarEnlaceRecuperacion.mockRejectedValueOnce(new supa.SupabaseAuthError('x', 'servicio'));
      expect((await UsuarioClienteController.restablecerContrasenia(datos)).status).toBe(503);
    });

    it('devuelve 401 si el correo verificado no es de un cliente activo', async () => {
      s.verificarEnlaceRecuperacion.mockResolvedValueOnce('cli@x.com');
      mockUC.getByCorreo.mockResolvedValueOnce(null);
      expect((await UsuarioClienteController.restablecerContrasenia(datos)).status).toBe(401);
    });

    it('actualiza la contraseña y cierra las sesiones abiertas', async () => {
      s.verificarEnlaceRecuperacion.mockResolvedValueOnce('cli@x.com');
      mockUC.getByCorreo.mockResolvedValueOnce(registroBase as never);
      mockHash.mockResolvedValueOnce('nuevo-hash');
      mockUC.updateContrasenia.mockResolvedValueOnce(true);

      const r = await UsuarioClienteController.restablecerContrasenia(datos);

      expect(r.status).toBe(200);
      expect(mockUC.updateContrasenia).toHaveBeenCalledWith(10, 'nuevo-hash');
      expect(mockRevocar).toHaveBeenCalledWith('cliente', 10);
    });
  });

  describe('me', () => {
    it('devuelve 401 con un token inválido', async () => {
      mockGetInfo.mockReturnValueOnce(null);
      expect((await UsuarioClienteController.me('x')).status).toBe(401);
    });

    it('devuelve 404 si el cliente no existe', async () => {
      mockGetInfo.mockReturnValueOnce({ id: '10' } as never);
      mockCliente.getById.mockResolvedValueOnce(null as never);
      expect((await UsuarioClienteController.me('x')).status).toBe(404);
    });
  });
});
