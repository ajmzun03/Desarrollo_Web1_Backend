import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// CORS: nunca '*', siempre desde env en producción.
// Fija vars a string vacío (dotenv no pisa variables ya presentes).

describe('utils/origins.ts', () => {
  const envBackup: Record<string, string | undefined> = {};
  const KEYS = ['CORS_ORIGINS', 'NODE_ENV', 'SECRET_KEY', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'];

  function setEnv(overrides: Record<string, string>) {
    for (const k of KEYS) process.env[k] = overrides[k] ?? '';
    // Secretos mínimos para que la guardia de config no truene al importar origins
    process.env.SECRET_KEY = overrides['SECRET_KEY'] ?? 'test-secreta';
    process.env.DATABASE_URL = overrides['DATABASE_URL'] ?? 'postgres://test';
    process.env.SUPABASE_URL = overrides['SUPABASE_URL'] ?? 'https://test.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = overrides['SUPABASE_PUBLISHABLE_KEY'] ?? 'sb_publishable_test';
    process.env.SUPABASE_SECRET_KEY = overrides['SUPABASE_SECRET_KEY'] ?? 'sb_secret_test';
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

  it('nunca exporta wildcard "*"', async () => {
    setEnv({ NODE_ENV: 'development', CORS_ORIGINS: '' });
    const { ACCEPTED_ORIGINS } = await import('./origins.js');
    expect(ACCEPTED_ORIGINS).not.toContain('*');
  });

  it('usa CORS_ORIGINS desde env cuando está definido', async () => {
    setEnv({ NODE_ENV: 'production', CORS_ORIGINS: 'https://a.com, https://b.com' });
    const { ACCEPTED_ORIGINS } = await import('./origins.js');
    expect(ACCEPTED_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  it('en producción sin CORS_ORIGINS devuelve lista vacía (falla cerrado)', async () => {
    setEnv({ NODE_ENV: 'production', CORS_ORIGINS: '' });
    const { ACCEPTED_ORIGINS } = await import('./origins.js');
    expect(ACCEPTED_ORIGINS).toEqual([]);
  });

  it('en dev sin CORS_ORIGINS usa la lista local (sin wildcard)', async () => {
    setEnv({ NODE_ENV: 'development', CORS_ORIGINS: '' });
    const { ACCEPTED_ORIGINS } = await import('./origins.js');
    expect(ACCEPTED_ORIGINS.length).toBeGreaterThan(0);
    expect(ACCEPTED_ORIGINS).not.toContain('*');
  });
});
