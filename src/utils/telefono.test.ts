import { describe, it, expect } from 'vitest';
import { normalizarTelefonoGT } from './telefono.js';

describe('normalizarTelefonoGT', () => {
  it('antepone 502 a un número local de 8 dígitos', () => {
    expect(normalizarTelefonoGT('58493915')).toBe('50258493915');
  });
  it('no duplica el código de país si ya viene (502 + 8 dígitos)', () => {
    expect(normalizarTelefonoGT('50258493915')).toBe('50258493915');
    expect(normalizarTelefonoGT('+502 5849-3915')).toBe('50258493915');
  });
  it('deja intacto un número internacional de otro país', () => {
    expect(normalizarTelefonoGT('+52 55 1234 5678')).toBe('525512345678');
  });
  it('limpia espacios y guiones', () => {
    expect(normalizarTelefonoGT('5849 3915')).toBe('50258493915');
    expect(normalizarTelefonoGT('5849-3915')).toBe('50258493915');
  });
  it('devuelve null si no hay un número válido', () => {
    for (const v of ['', '123', null, undefined, 'abc']) expect(normalizarTelefonoGT(v)).toBeNull();
  });
});
