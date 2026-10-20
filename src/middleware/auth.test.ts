import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';

vi.mock('../utils/generateToken.js', () => ({
  getInfoToToken: vi.fn(),
}));
vi.mock('../services/sesiones.service.js', () => ({
  estaRevocado: vi.fn(),
}));

import { authenticate, staffOnly, clienteOnly, requireRole, type AuthRequest } from './auth.js';
import { getInfoToToken } from '../utils/generateToken.js';
import { estaRevocado } from '../services/sesiones.service.js';

const mockGetInfo = vi.mocked(getInfoToToken, true);
const mockRevocado = vi.mocked(estaRevocado, true);

function makeReq(authHeader?: string, user?: unknown): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    user,
  } as unknown as AuthRequest;
}

function makeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authenticate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevocado.mockResolvedValue(false);
  });

  it('rechaza 401 si no hay header', async () => {
    const res = makeRes();
    const next = vi.fn();
    await authenticate(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza 401 si el token es inválido', async () => {
    mockGetInfo.mockReturnValueOnce(null);
    const res = makeRes();
    const next = vi.fn();
    await authenticate(makeReq('Bearer mala'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza 401 si el token tiene purpose (token temporal de 2FA)', async () => {
    mockGetInfo.mockReturnValueOnce({ id: '5', purpose: '2fa' } as never);
    const res = makeRes();
    const next = vi.fn();
    await authenticate(makeReq('Bearer tmp'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Token temporal no autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza 401 si la sesión fue revocada (logout / usuario desactivado)', async () => {
    mockGetInfo.mockReturnValueOnce({ id: '5', rol: 'ADMIN', jti: 'abc' } as never);
    mockRevocado.mockResolvedValueOnce(true);
    const res = makeRes();
    const next = vi.fn();
    await authenticate(makeReq('Bearer revocado'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('acepta token normal y llama next con req.user', async () => {
    mockGetInfo.mockReturnValueOnce({ id: '5', rol: 'ADMIN' } as never);
    const req = makeReq('Bearer bueno');
    const res = makeRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: '5', rol: 'ADMIN' });
  });
});

describe('staffOnly / clienteOnly', () => {
  const cliente = { id: '9', rol: 'CLIENTE', tipo: 'cliente' };
  const staff = { id: '5', rol: 'CAJERO' };

  it('staffOnly rechaza 403 a un cliente', () => {
    const res = makeRes();
    const next = vi.fn();
    staffOnly(makeReq('x', cliente), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('staffOnly deja pasar al personal', () => {
    const next = vi.fn();
    staffOnly(makeReq('x', staff), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('clienteOnly rechaza 403 al personal', () => {
    const res = makeRes();
    const next = vi.fn();
    clienteOnly(makeReq('x', staff), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('clienteOnly deja pasar a un cliente', () => {
    const next = vi.fn();
    clienteOnly(makeReq('x', cliente), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireRole', () => {
  it('rechaza 403 a un cliente aunque su rol sea "CLIENTE" y esté en la lista', () => {
    const res = makeRes();
    const next = vi.fn();
    requireRole('CLIENTE', 'ADMIN')(makeReq('x', { id: '1', rol: 'CLIENTE', tipo: 'cliente' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite un rol incluido', () => {
    const next = vi.fn();
    requireRole('ADMIN', 'CAJERO')(makeReq('x', { id: '1', rol: 'CAJERO' }), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza 403 un rol no incluido', () => {
    const res = makeRes();
    requireRole('ADMIN')(makeReq('x', { id: '1', rol: 'CAJERO' }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
