import { describe, it, expect, vi, beforeEach } from 'vitest';

// Estado mutable para alternar entre "Redis listo" y "sin Redis", y entre dev y producción
// (vi.hoisted: las fábricas de vi.mock se ejecutan antes que el resto del archivo)
const ctx = vi.hoisted(() => ({
  isProd: false,
  redis: {
    isReady: false,
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock('./redis.js', () => ({ redis: ctx.redis }));
vi.mock('../config.js', () => ({ get IS_PROD() { return ctx.isProd; } }));

import {
  MAX_INTENTOS, almacenDisponible, guardar, obtener, actualizar, destruir, registrarIntentoFallido, nuevoId,
} from './mfaPendiente.service.js';

const pendiente = { usuarioId: 1, sesion: { accessToken: 'a', refreshToken: 'r' }, mfa: 'verificar' as const, factorId: 'f1' };

describe('mfaPendiente.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ctx.redis.isReady = false;
    ctx.isProd = false;
  });

  it('nuevoId genera ids distintos', () => {
    expect(nuevoId()).not.toBe(nuevoId());
  });

  describe('sin Redis en desarrollo (memoria del proceso)', () => {
    it('guarda, lee, actualiza y destruye', async () => {
      const sid = nuevoId();
      expect(await guardar(sid, pendiente)).toBe(true);
      expect(await obtener(sid)).toEqual(pendiente);

      await actualizar(sid, { ...pendiente, factorId: 'f2' });
      expect((await obtener(sid))?.factorId).toBe('f2');

      await destruir(sid);
      expect(await obtener(sid)).toBeNull();
    });

    it('devuelve null para una sesión que no existe', async () => {
      expect(await obtener('inexistente')).toBeNull();
    });

    it('cuenta los intentos fallidos y los reinicia al destruir', async () => {
      const sid = nuevoId();
      await guardar(sid, pendiente);
      expect(await registrarIntentoFallido(sid)).toBe(1);
      expect(await registrarIntentoFallido(sid)).toBe(2);
      await destruir(sid);
      expect(await registrarIntentoFallido(sid)).toBe(1);
    });

    it('almacenDisponible es true en desarrollo', () => {
      expect(almacenDisponible()).toBe(true);
    });
  });

  describe('producción sin Redis: falla cerrado', () => {
    beforeEach(() => { ctx.isProd = true; });

    it('no hay almacén disponible', () => {
      expect(almacenDisponible()).toBe(false);
    });
    it('no guarda ni lee', async () => {
      expect(await guardar('s', pendiente)).toBe(false);
      expect(await obtener('s')).toBeNull();
    });
    it('trata cualquier intento como agotado', async () => {
      expect(await registrarIntentoFallido('s')).toBe(MAX_INTENTOS);
    });
  });

  describe('con Redis', () => {
    beforeEach(() => { ctx.redis.isReady = true; });

    it('guarda con vencimiento de 10 minutos', async () => {
      ctx.redis.set.mockResolvedValue('OK');
      expect(await guardar('s1', pendiente)).toBe(true);
      expect(ctx.redis.set).toHaveBeenCalledWith('mfa:pend:s1', JSON.stringify(pendiente), { EX: 600 });
    });

    it('lee y parsea el registro', async () => {
      ctx.redis.get.mockResolvedValue(JSON.stringify(pendiente));
      expect(await obtener('s1')).toEqual(pendiente);
      ctx.redis.get.mockResolvedValue(null);
      expect(await obtener('s1')).toBeNull();
    });

    it('actualiza conservando el tiempo de vida restante', async () => {
      ctx.redis.set.mockResolvedValue('OK');
      await actualizar('s1', pendiente);
      expect(ctx.redis.set).toHaveBeenCalledWith('mfa:pend:s1', JSON.stringify(pendiente), { KEEPTTL: true });
    });

    it('cuenta intentos de forma atómica con INCR y fija el vencimiento solo la primera vez', async () => {
      ctx.redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
      expect(await registrarIntentoFallido('s1')).toBe(1);
      expect(await registrarIntentoFallido('s1')).toBe(2);
      expect(ctx.redis.incr).toHaveBeenCalledWith('mfa:intentos:s1');
      expect(ctx.redis.expire).toHaveBeenCalledTimes(1);
    });

    it('destruir borra el registro y el contador', async () => {
      ctx.redis.del.mockResolvedValue(2);
      await destruir('s1');
      expect(ctx.redis.del).toHaveBeenCalledWith(['mfa:pend:s1', 'mfa:intentos:s1']);
    });

    it('en producción, si Redis falla al contar intentos, falla cerrado', async () => {
      ctx.isProd = true;
      ctx.redis.incr.mockRejectedValue(new Error('boom'));
      expect(await registrarIntentoFallido('s1')).toBe(MAX_INTENTOS);
    });
  });
});
