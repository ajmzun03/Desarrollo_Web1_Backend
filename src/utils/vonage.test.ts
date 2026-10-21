import { describe, it, expect } from 'vitest';
import { evaluarRespuestaVonage } from './vonage.js';

describe('evaluarRespuestaVonage', () => {
  it('acepta cuando todos los mensajes tienen status 0', () => {
    expect(evaluarRespuestaVonage({ messages: [{ status: '0', to: '50258493915' }] }).ok).toBe(true);
    expect(evaluarRespuestaVonage({ messages: [{ status: 0 }, { status: '0' }] }).ok).toBe(true);
  });

  it('rechaza y explica la causa cuando Vonage devuelve un status de error', () => {
    const r = evaluarRespuestaVonage({ messages: [{ status: '29', 'error-text': 'Non White-listed Destination' }] });
    expect(r.ok).toBe(false);
    expect(r.detalle).toContain('29');
    expect(r.detalle).toContain('Non White-listed');
  });

  it('rechaza si basta con que un mensaje falle', () => {
    expect(evaluarRespuestaVonage({ messages: [{ status: '0' }, { status: '9', errorText: 'Quota Exceeded' }] }).ok).toBe(false);
  });

  it('rechaza una respuesta vacía o ausente', () => {
    expect(evaluarRespuestaVonage({ messages: [] }).ok).toBe(false);
    expect(evaluarRespuestaVonage(undefined).ok).toBe(false);
    expect(evaluarRespuestaVonage(null).ok).toBe(false);
  });
});
