import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function cargar(env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.resetModules();
  return import('./config.js');
}

describe('OTP_EN_LOG (código 2FA en el log)', () => {
  it('se activa en desarrollo con OTP_MOSTRAR_EN_LOG=true', async () => {
    const c = await cargar({ NODE_ENV: 'development', OTP_MOSTRAR_EN_LOG: 'true', SECRET_KEY: 'x' });
    expect(c.OTP_EN_LOG).toBe(true);
  });

  it('NUNCA se activa en producción, aunque la variable esté en true', async () => {
    const c = await cargar({ NODE_ENV: 'production', OTP_MOSTRAR_EN_LOG: 'true', SECRET_KEY: 'x', DATABASE_URL: 'postgres://u:p@h/db' });
    expect(c.OTP_EN_LOG).toBe(false);
  });

  it('está apagado por defecto', async () => {
    const c = await cargar({ NODE_ENV: 'development', OTP_MOSTRAR_EN_LOG: '', SECRET_KEY: 'x' });
    expect(c.OTP_EN_LOG).toBe(false);
  });
});
