import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../services/redis.js', () => ({
  redis: {
    isReady: true,
    get: vi.fn(),
    set: vi.fn(),
    scanIterator: vi.fn(),
    del: vi.fn(),
  },
}));

import { redis } from '../services/redis.js';
import { cache, invalidateTags } from './cache.js';

const mockRedis = vi.mocked(redis, true as never);

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    originalUrl: '/municipios/departamentos',
    ...overrides,
  } as Request;
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    type() {
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { headers: Record<string, string>; body: unknown };
}

describe('middleware/cache', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve HIT sin ejecutar el handler cuando Redis tiene la key', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ data: [1, 2] }));
    const next = vi.fn();
    const res = mockRes();

    await new Promise<void>((resolve) => {
      const mw = cache('tag-test', 60);
      mw(mockReq(), res, (err?: unknown) => {
        next(err);
        resolve();
      });
      // el middleware responde en cadena .then, no llama a next en HIT
      setTimeout(resolve, 10);
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.headers['X-Cache']).toBe('HIT');
    expect(res.body).toBe(JSON.stringify({ data: [1, 2] }));
  });

  it('marca MISS y cachea la respuesta 200 cuando no hay hit', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.set.mockResolvedValueOnce('OK');
    const next = vi.fn();
    const res = mockRes();

    await new Promise<void>((resolve) => {
      const mw = cache('tag-test', 30);
      mw(mockReq(), res, () => {
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalled();
    // simula el controller respondiendo
    res.json({ data: 'ok' });
    expect(res.headers['X-Cache']).toBe('MISS');
    expect(mockRedis.set).toHaveBeenCalledWith(
      'cache:tag-test:/municipios/departamentos',
      JSON.stringify({ data: 'ok' }),
      { EX: 30 }
    );
  });

  it('no cachea cuando Redis no está listo', () => {
    mockRedis.isReady = false;
    const next = vi.fn();
    const res = mockRes();

    const mw = cache('tag-test', 30);
    mw(mockReq(), res, next);

    expect(next).toHaveBeenCalled();
    expect(mockRedis.get).not.toHaveBeenCalled();
    mockRedis.isReady = true;
  });

  it('no cachea respuestas que no sean 200', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    const next = vi.fn();
    const res = mockRes();
    res.statusCode = 500;

    await new Promise<void>((resolve) => {
      const mw = cache('tag-test', 30);
      mw(mockReq(), res, () => {
        next();
        resolve();
      });
    });

    res.json({ error: 'boom' });
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('no aplica a métodos no-GET', () => {
    const next = vi.fn();
    const mw = cache('tag-test', 30);
    mw(mockReq({ method: 'POST' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(mockRedis.get).not.toHaveBeenCalled();
  });
});

describe('middleware/cache.invalidateTags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('escanea y borra las keys del tag', async () => {
    mockRedis.scanIterator.mockReturnValueOnce(
      (async function* () {
        yield ['cache:municipios:/a', 'cache:municipios:/b'];
      })()
    );
    mockRedis.del.mockResolvedValueOnce(2);

    await invalidateTags('municipios');

    expect(mockRedis.del).toHaveBeenCalledWith(['cache:municipios:/a', 'cache:municipios:/b']);
  });

  it('no lanza cuando Redis no está listo', async () => {
    mockRedis.isReady = false;
    await expect(invalidateTags('municipios')).resolves.toBeUndefined();
    mockRedis.isReady = true;
  });

  it('no hace nada si no hay tags', async () => {
    await invalidateTags();
    expect(mockRedis.scanIterator).not.toHaveBeenCalled();
  });
});

describe('middleware/cache — límites de la clave', () => {
  beforeEach(() => mockRedis.get.mockClear());

  const peticion = (url: string, query: Record<string, string> = {}) =>
    ({ method: 'GET', originalUrl: url, query }) as never;

  it('no cachea una URL demasiado larga (evita llenar Redis con claves arbitrarias)', async () => {
    const next = vi.fn();
    cache('catalogo', 60)(peticion('/x?' + 'a'.repeat(300)), {} as never, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).not.toHaveBeenCalled(); // pasó directo, sin consultar Redis
  });

  it('no cachea una URL con demasiados parámetros', async () => {
    const next = vi.fn();
    const query = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`p${i}`, '1']));
    cache('catalogo', 60)(peticion('/x?p0=1&p1=1&p2=1&p3=1&p4=1&p5=1', query), {} as never, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).not.toHaveBeenCalled(); // pasó directo, sin consultar Redis
  });
});
