import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({
  SUPABASE_URL: 'https://proyecto.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
}));

// Cada llamada a createClient devuelve un cliente falso; se distingue admin de público por la clave.
const admin = {
  auth: {
    admin: {
      generateLink: vi.fn(),
      createUser: vi.fn(),
      signOut: vi.fn(),
      mfa: { listFactors: vi.fn(), deleteFactor: vi.fn() },
    },
  },
};
const publico = {
  auth: {
    setSession: vi.fn(),
    verifyOtp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
    mfa: {
      listFactors: vi.fn(),
      enroll: vi.fn(),
      unenroll: vi.fn(),
      challengeAndVerify: vi.fn(),
      getAuthenticatorAssuranceLevel: vi.fn(),
    },
  },
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((_url: string, clave: string) => (clave === 'sb_secret_test' ? admin : publico)),
}));

import {
  SupabaseAuthError, abrirSesion, factorVerificado, enrolarTotp, verificarCodigoTotp,
  cerrarSesion, reiniciarMfa, enviarCorreoRecuperacion, verificarEnlaceRecuperacion, supabaseConfigurado,
} from './supabaseAuth.service.js';

const sesion = { accessToken: 'acc', refreshToken: 'ref' };

describe('supabaseAuth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    publico.auth.setSession.mockResolvedValue({ error: null });
    publico.auth.signOut.mockResolvedValue({ error: null });
  });

  it('supabaseConfigurado es true con las tres variables', () => {
    expect(supabaseConfigurado()).toBe(true);
  });

  describe('abrirSesion', () => {
    it('genera el enlace con la clave secreta y lo canjea con la publicable', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'th' }, user: { id: 'u1' } }, error: null });
      publico.auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'A', refresh_token: 'R' } }, error: null });

      const r = await abrirSesion('a@mc.com');

      expect(r).toEqual({ accessToken: 'A', refreshToken: 'R' });
      expect(admin.auth.admin.generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: 'a@mc.com' });
      expect(publico.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'th', type: 'magiclink' });
    });

    it('canjea el enlace con el tipo que informa Supabase (usuario nuevo => "signup")', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'th', verification_type: 'signup' }, user: { id: 'u1' } }, error: null });
      publico.auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'A', refresh_token: 'R' } }, error: null });

      await abrirSesion('nuevo@mc.com');

      expect(publico.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'th', type: 'signup' });
    });

    it('lanza SupabaseAuthError "servicio" si falla generateLink', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: null, error: { message: 'x', status: 500 } });
      await expect(abrirSesion('a@mc.com')).rejects.toMatchObject({ name: 'SupabaseAuthError', codigo: 'servicio' });
    });

    it('lanza "limite" ante un 429', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: null, error: { message: 'rate', status: 429 } });
      await expect(abrirSesion('a@mc.com')).rejects.toMatchObject({ codigo: 'limite' });
    });
  });

  describe('factorVerificado', () => {
    it('devuelve el id del factor TOTP verificado', async () => {
      publico.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'f0', status: 'unverified' }, { id: 'f1', status: 'verified' }] }, error: null });
      expect(await factorVerificado(sesion)).toBe('f1');
      expect(publico.auth.setSession).toHaveBeenCalledWith({ access_token: 'acc', refresh_token: 'ref' });
    });

    it('devuelve null si solo hay factores sin verificar (debe enrolar)', async () => {
      publico.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'f0', status: 'unverified' }] }, error: null });
      expect(await factorVerificado(sesion)).toBeNull();
    });
  });

  describe('enrolarTotp', () => {
    it('elimina factores sin verificar previos y devuelve el QR', async () => {
      publico.auth.mfa.listFactors.mockResolvedValue({
        data: { all: [{ id: 'viejo', factor_type: 'totp', status: 'unverified' }, { id: 'ok', factor_type: 'totp', status: 'verified' }] },
        error: null,
      });
      publico.auth.mfa.unenroll.mockResolvedValue({ error: null });
      publico.auth.mfa.enroll.mockResolvedValue({ data: { id: 'nuevo', totp: { qr_code: 'data:image/svg+xml;utf8,<svg/>', secret: 'S3CR3T', uri: 'otpauth://totp/x' } }, error: null });

      const r = await enrolarTotp(sesion);

      expect(r).toEqual({ factorId: 'nuevo', qrCode: 'data:image/svg+xml;utf8,<svg/>', secret: 'S3CR3T', uri: 'otpauth://totp/x' });
      expect(publico.auth.mfa.unenroll).toHaveBeenCalledTimes(1);
      expect(publico.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'viejo' });
      expect(publico.auth.mfa.enroll).toHaveBeenCalledWith(expect.objectContaining({ factorType: 'totp' }));
    });
  });

  describe('verificarCodigoTotp', () => {
    it('acepta el código si la sesión sube a aal2 y siempre cierra la sesión', async () => {
      publico.auth.mfa.challengeAndVerify.mockResolvedValue({ data: {}, error: null });
      publico.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });

      await expect(verificarCodigoTotp(sesion, 'f1', '123456')).resolves.toBeUndefined();

      expect(publico.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: 'f1', code: '123456' });
      // al acertar se cierra solo esa sesión (scope local), no todas las del usuario
      expect(publico.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('rechaza un código incorrecto con "codigo_invalido" SIN cerrar la sesión (para poder reintentar)', async () => {
      publico.auth.mfa.challengeAndVerify.mockResolvedValue({ data: null, error: { message: 'Invalid TOTP code', status: 400, code: 'mfa_verification_failed' } });
      await expect(verificarCodigoTotp(sesion, 'f1', '000000')).rejects.toMatchObject({ codigo: 'codigo_invalido' });
      expect(publico.auth.signOut).not.toHaveBeenCalled();
    });

    it('una sesión intermedia revocada o vencida => sesion_invalida', async () => {
      publico.auth.setSession.mockResolvedValue({ error: { message: 'Auth session missing!', code: 'session_not_found' } });
      await expect(verificarCodigoTotp(sesion, 'f1', '123456')).rejects.toMatchObject({ codigo: 'sesion_invalida' });
      expect(publico.auth.mfa.challengeAndVerify).not.toHaveBeenCalled();
    });

    it('rechaza si la sesión no llega a aal2', async () => {
      publico.auth.mfa.challengeAndVerify.mockResolvedValue({ data: {}, error: null });
      publico.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
      await expect(verificarCodigoTotp(sesion, 'f1', '123456')).rejects.toMatchObject({ codigo: 'codigo_invalido' });
    });

    it('distingue el límite de solicitudes de un código incorrecto', async () => {
      publico.auth.mfa.challengeAndVerify.mockResolvedValue({ data: null, error: { message: 'rate', status: 429, code: 'over_request_rate_limit' } });
      await expect(verificarCodigoTotp(sesion, 'f1', '123456')).rejects.toMatchObject({ codigo: 'limite' });
    });
  });

  describe('cerrarSesion', () => {
    it('nunca lanza aunque Supabase falle', async () => {
      admin.auth.admin.signOut.mockRejectedValue(new Error('caído'));
      await expect(cerrarSesion(sesion)).resolves.toBeUndefined();
    });

    it('revoca solo esa sesión (scope local), no las demás del usuario', async () => {
      admin.auth.admin.signOut.mockResolvedValue({ error: null });
      await cerrarSesion(sesion);
      expect(admin.auth.admin.signOut).toHaveBeenCalledWith('acc', 'local');
    });
  });

  describe('reiniciarMfa', () => {
    it('elimina todos los factores del usuario y devuelve cuántos', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: { user: { id: 'u1' }, properties: {} }, error: null });
      admin.auth.admin.mfa.listFactors.mockResolvedValue({ data: { factors: [{ id: 'a' }, { id: 'b' }] }, error: null });
      admin.auth.admin.mfa.deleteFactor.mockResolvedValue({ error: null });

      expect(await reiniciarMfa('a@mc.com')).toBe(2);
      expect(admin.auth.admin.mfa.deleteFactor).toHaveBeenCalledWith({ id: 'a', userId: 'u1' });
      expect(admin.auth.admin.mfa.deleteFactor).toHaveBeenCalledWith({ id: 'b', userId: 'u1' });
    });

    it('devuelve 0 si el usuario no tenía autenticador', async () => {
      admin.auth.admin.generateLink.mockResolvedValue({ data: { user: { id: 'u1' }, properties: {} }, error: null });
      admin.auth.admin.mfa.listFactors.mockResolvedValue({ data: { factors: [] }, error: null });
      expect(await reiniciarMfa('a@mc.com')).toBe(0);
    });
  });

  describe('enviarCorreoRecuperacion', () => {
    it('crea el usuario si no existe y pide el correo con el redirectTo', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ data: {}, error: null });
      publico.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      await enviarCorreoRecuperacion('a@mc.com', 'http://localhost:5173/copac/restablecer');

      expect(admin.auth.admin.createUser).toHaveBeenCalledWith({ email: 'a@mc.com', email_confirm: true });
      expect(publico.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@mc.com', { redirectTo: 'http://localhost:5173/copac/restablecer' });
    });

    it('tolera que el usuario ya exista en Supabase', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ data: null, error: { message: 'exists', code: 'email_exists', status: 422 } });
      publico.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
      await expect(enviarCorreoRecuperacion('a@mc.com', '')).resolves.toBeUndefined();
      expect(publico.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@mc.com', undefined);
    });

    it('propaga otros errores al crear el usuario', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ data: null, error: { message: 'boom', status: 500 } });
      await expect(enviarCorreoRecuperacion('a@mc.com', '')).rejects.toBeInstanceOf(SupabaseAuthError);
    });
  });

  describe('verificarEnlaceRecuperacion', () => {
    it('devuelve el correo verificado en minúsculas y cierra la sesión', async () => {
      publico.auth.verifyOtp.mockResolvedValue({ data: { user: { email: 'Admin@MC.com' } }, error: null });
      expect(await verificarEnlaceRecuperacion('th')).toBe('admin@mc.com');
      expect(publico.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'th', type: 'recovery' });
      expect(publico.auth.signOut).toHaveBeenCalled();
    });

    it('lanza "enlace_invalido" si el enlace venció o ya se usó', async () => {
      publico.auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: { message: 'expired', status: 403 } });
      await expect(verificarEnlaceRecuperacion('th')).rejects.toMatchObject({ codigo: 'enlace_invalido' });
    });
  });
});
