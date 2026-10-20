import { describe, it, expect } from 'vitest';
import { ErrorNegocio, errorDb, idValido } from './errors.js';
import { TRANSICIONES_PEDIDO, TRANSICIONES_ORDEN_TRABAJO, validarTransicion } from './transiciones.js';

describe('errorDb', () => {
  it('respeta el status y mensaje de un ErrorNegocio', () => {
    expect(errorDb(new ErrorNegocio('Stock insuficiente', 409), 'x')).toEqual({ data: null, error: 'Stock insuficiente', status: 409 });
  });

  it('mapea violación de unicidad (23505) a 409, también cuando viene en cause (drizzle)', () => {
    expect(errorDb({ code: '23505' }, 'x').status).toBe(409);
    expect(errorDb({ cause: { code: '23505' } }, 'x').status).toBe(409);
  });

  it('mapea FK (23503) a 409 y formato inválido (22P02) a 400', () => {
    expect(errorDb({ code: '23503' }, 'x').status).toBe(409);
    expect(errorDb({ code: '22P02' }, 'x').status).toBe(400);
    expect(errorDb({ code: '23514' }, 'x').status).toBe(400);
  });

  it('mapea "no encontrado" de los modelos a 404', () => {
    expect(errorDb(new Error('Producto no encontrado'), 'x').status).toBe(404);
    expect(errorDb(new Error('No se encontró el cliente'), 'x').status).toBe(404);
  });

  it('cualquier otro error es 500 con el mensaje genérico (sin filtrar el interno)', () => {
    const r = errorDb(new Error('connection refused to 10.0.0.5'), 'Error al crear X');
    expect(r).toEqual({ data: null, error: 'Error al crear X', status: 500 });
  });
});

describe('idValido', () => {
  it('acepta enteros positivos', () => expect(idValido('12')).toBe(12));
  it('rechaza NaN, cero, negativos y decimales', () => {
    for (const v of ['abc', '0', '-3', '1.5', undefined]) {
      expect(() => idValido(v)).toThrow('inválido');
    }
  });
});

describe('validarTransicion', () => {
  it('permite transiciones definidas', () => {
    expect(() => validarTransicion(TRANSICIONES_PEDIDO, 'CREADO', 'LISTO', 'el pedido')).not.toThrow();
    expect(() => validarTransicion(TRANSICIONES_PEDIDO, 'EN_RUTA', 'ENTREGADO', 'el pedido')).not.toThrow();
    expect(() => validarTransicion(TRANSICIONES_ORDEN_TRABAJO, 'GENERADA', 'EN_PREPARACION', 'la orden')).not.toThrow();
  });

  it('rechaza estados terminales y saltos no permitidos con 409', () => {
    for (const [desde, hacia] of [['ENTREGADO', 'CREADO'], ['ANULADO', 'LISTO'], ['CREADO', 'ENTREGADO']] as const) {
      try {
        validarTransicion(TRANSICIONES_PEDIDO, desde, hacia, 'el pedido');
        expect.unreachable();
      } catch (e) {
        expect((e as ErrorNegocio).status).toBe(409);
      }
    }
  });

  it('rechaza repetir el mismo estado', () => {
    expect(() => validarTransicion(TRANSICIONES_PEDIDO, 'LISTO', 'LISTO', 'el pedido')).toThrow('ya está');
  });

  it('no valida cuando no hay estado previo (registros antiguos)', () => {
    expect(() => validarTransicion(TRANSICIONES_ORDEN_TRABAJO, null, 'FINALIZADA', 'la orden')).not.toThrow();
  });
});
