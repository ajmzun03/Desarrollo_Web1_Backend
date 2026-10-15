import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Guardia de config: en producción no se puede arrancar sin secretos obligatorios.
// Usa import dinámico + resetModules. Fija vars a string vacío (dotenv no pisa
// variables ya presentes en process.env, así el .env real no contamina el test).

describe('config.ts guardia de producción', () => {
  const envBackup: Record<string, string | undefined> = {};
  const KEYS = ['NODE_ENV', 'SECRET_KEY', 'DATABASE_URL', 'CORS_ORIGINS', 'SALT_ROUND'];

  function setEnv(overrides: Record<string, string>) {
    for (const k of KEYS) process.env[k] = overrides[k] ?? '';
    for (const [k, v] of Object.entries(overrides)) process.env[k] = v;
  }

  beforeEach(() => {
    vi.resetModules();
    for (const k of KEYS) envBackup[k] = process.env[k];
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(envBackup)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('arranca en desarrollo sin secretos (defaults vacíos)', async () => {
    setEnv({ NODE_ENV: 'development' });
    const config = await import('./config.js');
    expect(config.IS_DEV).toBe(true);
    expect(config.IS_PROD).toBe(false);
    expect(config.SECRET_KEY).toBe('');
  });

  it('en producción sin SECRET_KEY lanza error con el nombre de la variable', async () => {
    setEnv({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x' });
    await expect(import('./config.js')).rejects.toThrow(/SECRET_KEY/);
  });

  it('en producción sin DATABASE_URL lanza error', async () => {
    setEnv({ NODE_ENV: 'production', SECRET_KEY: 'secreta' });
    await expect(import('./config.js')).rejects.toThrow(/DATABASE_URL/);
  });

  it('en producción con todos los secretos arranca', async () => {
    setEnv({ NODE_ENV: 'production', SECRET_KEY: 'secreta', DATABASE_URL: 'postgres://x' });
    const config = await import('./config.js');
    expect(config.IS_PROD).toBe(true);
    expect(config.SECRET_KEY).toBe('secreta');
  });

  it('SALT_ROUND inválido cae a 10 (no NaN)', async () => {
    setEnv({ NODE_ENV: 'development', SALT_ROUND: 'no-numero' });
    const config = await import('./config.js');
    expect(config.SALT_ROUND).toBe(10);
  });

  it('SALT_ROUND válido se usa', async () => {
    setEnv({ NODE_ENV: 'development', SALT_ROUND: '14' });
    const config = await import('./config.js');
    expect(config.SALT_ROUND).toBe(14);
  });

  describe('normalización de NODE_ENV (falla cerrado)', () => {
    const secretos = { SECRET_KEY: 'secreta', DATABASE_URL: 'postgres://x' };

    it('el valor legado "prod" cuenta como producción (no como dev)', async () => {
      setEnv({ NODE_ENV: 'prod', ...secretos });
      const config = await import('./config.js');
      expect(config.IS_PROD).toBe(true);
      expect(config.IS_DEV).toBe(false);
    });

    it('mayúsculas se normalizan: "Production" es producción', async () => {
      setEnv({ NODE_ENV: 'Production', ...secretos });
      const config = await import('./config.js');
      expect(config.IS_PROD).toBe(true);
    });

    it('"TEST" cuenta como desarrollo', async () => {
      setEnv({ NODE_ENV: 'TEST' });
      const config = await import('./config.js');
      expect(config.IS_DEV).toBe(true);
      expect(config.IS_PROD).toBe(false);
    });

    it('un valor desconocido detiene el arranque (no asume dev)', async () => {
      setEnv({ NODE_ENV: 'prd' });
      await expect(import('./config.js')).rejects.toThrow(/NODE_ENV inválido/);
    });

    it('otro valor desconocido también detiene el arranque', async () => {
      setEnv({ NODE_ENV: 'staging' });
      await expect(import('./config.js')).rejects.toThrow(/NODE_ENV inválido/);
    });

    it('un "prod" desconocido NO obtiene el trato blando de dev', async () => {
      // Sin secretos: si asumiera dev arrancaría; con la validación debe fallar.
      setEnv({ NODE_ENV: 'produccion' });
      await expect(import('./config.js')).rejects.toThrow(/NODE_ENV inválido/);
    });
  });
});
