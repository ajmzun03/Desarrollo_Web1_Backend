import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./redis.js', () => ({
  redis: {
    isReady: true,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

// Control mutable de IS_PROD para alternar entre dev (degrada) y prod (falla cerrado)
let mockIsProd = false;
vi.mock('../config.js', () => ({
  get IS_PROD() { return mockIsProd; },
}));

import { redis } from './redis.js';
import { generarCodigo, guardarCodigo, verificarCodigo, puedeGenerarCodigo } from './otp.service.js';

const mockRedis = vi.mocked(redis, true);

describe('otp.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generarCodigo', () => {
    it('genera un código de 6 dígitos', () => {
      const codigo = generarCodigo();
      expect(codigo).toMatch(/^\d{6}$/);
    });

    it('genera códigos distintos', () => {
      const codes = new Set(Array.from({ length: 20 }, () => generarCodigo()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('guardarCodigo', () => {
    it('guarda con TTL 300 y devuelve true', async () => {
      mockRedis.set.mockResolvedValueOnce('OK');
      const ok = await guardarCodigo('login', 'usuario', 1, '123456');
      expect(ok).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:login:usuario:1',
        expect.stringContaining('"hash":'),
        { EX: 300 }
      );
    });

    it('devuelve false si Redis no está listo', async () => {
      mockRedis.isReady = false;
      const ok = await guardarCodigo('login', 'usuario', 1, '123456');
      expect(ok).toBe(false);
      mockRedis.isReady = true;
    });

    it('no guarda el código en claro', async () => {
      mockRedis.set.mockResolvedValueOnce('OK');
      await guardarCodigo('reset', 'cliente', 9, '654321');
      const payload = mockRedis.set.mock.calls[0]![1] as string;
      expect(payload).not.toContain('654321');
      expect(payload).toContain('"hash":');
    });
  });

  describe('verificarCodigo', () => {
    it('devuelve ok y borra la key al acertar', async () => {
      // guardar primero para conocer el hash
      let storedPayload = '';
      mockRedis.set.mockImplementation(async (_k, v) => {
        storedPayload = v as string;
        return 'OK';
      });
      await guardarCodigo('login', 'usuario', 1, '111222');

      mockRedis.get.mockResolvedValueOnce(storedPayload);
      mockRedis.del.mockResolvedValueOnce(1);

      const verdict = await verificarCodigo('login', 'usuario', 1, '111222');
      expect(verdict).toBe('ok');
      expect(mockRedis.del).toHaveBeenCalledWith('otp:login:usuario:1');
    });

    it('devuelve expirado si la key no existe', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const verdict = await verificarCodigo('login', 'usuario', 1, '000000');
      expect(verdict).toBe('expirado');
    });

    it('devuelve invalido y no borra al fallar una vez', async () => {
      let storedPayload = '';
      mockRedis.set.mockImplementation(async (_k, v) => {
        storedPayload = v as string;
        return 'OK';
      });
      await guardarCodigo('login', 'usuario', 1, '111222');

      mockRedis.get.mockResolvedValueOnce(storedPayload);
      mockRedis.set.mockResolvedValueOnce('OK');

      const verdict = await verificarCodigo('login', 'usuario', 1, '999999');
      expect(verdict).toBe('invalido');
      expect(mockRedis.del).not.toHaveBeenCalled();
      // el nuevo payload incrementa intentos
      const nuevo = mockRedis.set.mock.calls.at(-1)![1] as string;
      expect(nuevo).toContain('"intentos":1');
    });

    it('devuelve agotado y borra tras 5 fallos', async () => {
      // payload con 4 intentos previos → el 5º fallo agota
      const crypto = await import('node:crypto');
      const hash = crypto.createHash('sha256').update('111222').digest('hex');
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ hash, intentos: 4 }));
      mockRedis.del.mockResolvedValueOnce(1);

      const verdict = await verificarCodigo('login', 'usuario', 1, '999999');
      expect(verdict).toBe('agotado');
      expect(mockRedis.del).toHaveBeenCalledWith('otp:login:usuario:1');
    });
  });

  describe('puedeGenerarCodigo', () => {
    it('permite hasta 3 envíos', async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockRedis.expire.mockResolvedValueOnce(1 as never);
      expect(await puedeGenerarCodigo('usuario', 1)).toBe(true);

      mockRedis.incr.mockResolvedValueOnce(3);
      expect(await puedeGenerarCodigo('usuario', 1)).toBe(true);
    });

    it('bloquea a partir del 4º envío', async () => {
      mockRedis.incr.mockResolvedValueOnce(4);
      expect(await puedeGenerarCodigo('usuario', 1)).toBe(false);
    });

    it('permite si Redis no está listo (degradado)', async () => {
      mockRedis.isReady = false;
      expect(await puedeGenerarCodigo('usuario', 1)).toBe(true);
      mockRedis.isReady = true;
    });
  });
});
