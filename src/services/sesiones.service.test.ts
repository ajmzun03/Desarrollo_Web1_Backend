import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = vi.hoisted(() => ({
  isReady: true,
  set: vi.fn(),
  get: vi.fn(),
  exists: vi.fn(),
}));
vi.mock('./redis.js', () => ({ redis: mockRedis }));
vi.mock('../config/logger.js', () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { estaRevocado, revocarToken, revocarSesionesDe } from './sesiones.service.js';

const ahora = () => Math.floor(Date.now() / 1000);

describe('sesiones.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRedis.isReady = true;
  });

  it('revocarToken guarda el jti hasta que expire el token', async () => {
    await revocarToken('abc', ahora() + 100);
    const [clave, valor, opts] = mockRedis.set.mock.calls[0]!;
    expect(clave).toBe('revoked:jti:abc');
    expect(valor).toBe('1');
    expect(opts.EX).toBeGreaterThan(90);
    expect(opts.EX).toBeLessThanOrEqual(100);
  });

  it('revocarToken sin jti o sin Redis no hace nada', async () => {
    expect(await revocarToken(undefined, ahora() + 10)).toBe(false);
    mockRedis.isReady = false;
    expect(await revocarToken('abc', ahora() + 10)).toBe(false);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('estaRevocado detecta un jti revocado', async () => {
    mockRedis.exists.mockResolvedValueOnce(1);
    expect(await estaRevocado({ id: '5', jti: 'abc', iat: ahora() } as never)).toBe(true);
  });

  it('estaRevocado invalida tokens emitidos antes de revocar todas las sesiones del usuario', async () => {
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.get.mockResolvedValueOnce(String(ahora()));
    expect(await estaRevocado({ id: '5', jti: 'x', iat: ahora() - 60 } as never)).toBe(true);
    expect(mockRedis.get).toHaveBeenCalledWith('revoked:since:usuario:5');
  });

  it('estaRevocado permite tokens emitidos DESPUÉS de la revocación (nuevo login)', async () => {
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.get.mockResolvedValueOnce(String(ahora() - 60));
    expect(await estaRevocado({ id: '5', jti: 'x', iat: ahora() } as never)).toBe(false);
  });

  it('usa el tipo cliente en la clave de revocación', async () => {
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.get.mockResolvedValueOnce(null);
    await estaRevocado({ id: '9', tipo: 'cliente', iat: ahora() } as never);
    expect(mockRedis.get).toHaveBeenCalledWith('revoked:since:cliente:9');
  });

  it('si Redis falla o no está listo, permite (no tumba la API)', async () => {
    mockRedis.exists.mockRejectedValueOnce(new Error('down'));
    expect(await estaRevocado({ id: '5', jti: 'x', iat: ahora() } as never)).toBe(false);
    mockRedis.isReady = false;
    expect(await estaRevocado({ id: '5', jti: 'x', iat: ahora() } as never)).toBe(false);
  });

  it('revocarSesionesDe guarda la marca de tiempo', async () => {
    await revocarSesionesDe('usuario', 7);
    expect(mockRedis.set.mock.calls[0]![0]).toBe('revoked:since:usuario:7');
  });
});
