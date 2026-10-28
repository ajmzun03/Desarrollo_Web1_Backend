import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('services/s3', () => {
  it('importar el módulo NO falla sin variables AWS_* (CI, tests): el cliente es perezoso', async () => {
    vi.stubEnv('AWS_REGION', '');
    vi.stubEnv('AWS_ACCESS_KEY_ID', '');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '');
    vi.resetModules();
    await expect(import('./s3.js')).resolves.toHaveProperty('uploadFile');
  });

  it('con credenciales firma una URL de subida sin llamar a AWS', async () => {
    vi.stubEnv('AWS_REGION', 'us-east-2');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIATEST');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secreto-de-prueba');
    vi.stubEnv('S3_BUCKET_NAME', 'bucket-prueba');
    vi.resetModules();
    const { uploadFile } = await import('./s3.js');
    const r = await uploadFile('foto de prueba!.png', 'image/png', 1024);
    expect(r.uploadUrl).toContain('bucket-prueba');
    expect(r.fileKey).toMatch(/^uploads\/\d+-[0-9a-f-]{8}-foto_de_prueba_\.png$/);
  });
});
