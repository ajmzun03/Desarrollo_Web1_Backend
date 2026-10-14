import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../utils/generateToken.js', () => ({
  getInfoToToken: vi.fn(),
}));

import { authenticate, type AuthRequest } from './auth.js';
import { getInfoToToken } from '../utils/generateToken.js';

const mockGetInfo = vi.mocked(getInfoToToken, true);

function makeReq(authHeader?: string): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as AuthRequest;
}

function makeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authenticate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza 401 si no hay header', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza 401 si el token es inválido', () => {
    mockGetInfo.mockReturnValueOnce(null);
    const res = makeRes();
    const next = vi.fn();
    authenticate(makeReq('Bearer mala'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza 401 si el token tiene purpose (token temporal de 2FA)', () => {
    mockGetInfo.mockReturnValueOnce({ id: '5', purpose: '2fa' } as never);
    const res = makeRes();
    const next = vi.fn();
    authenticate(makeReq('Bearer tmp'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Token temporal no autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('acepta token normal y llama next con req.user', () => {
    mockGetInfo.mockReturnValueOnce({ id: '5', rol: 'ADMIN' } as never);
    const req = makeReq('Bearer bueno');
    const res = makeRes();
    const next = vi.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: '5', rol: 'ADMIN' });
  });
});
