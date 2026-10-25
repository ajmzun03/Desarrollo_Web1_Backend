export interface RespuestaVonageSMS {
  messages?: Array<{ status?: string | number; 'error-text'?: string; errorText?: string; network?: string; to?: string }>
}

/**
 * Vonage responde 200 aunque rechace el mensaje: el resultado real está en messages[].status
 * ("0" = aceptado). Devuelve { ok, detalle } para registrar la causa cuando falla
 * (p. ej. 29 = destino no autorizado en cuenta de prueba, 15 = destino inválido, 9 = saldo insuficiente).
 */
export function evaluarRespuestaVonage(resp: RespuestaVonageSMS | null | undefined): { ok: boolean; detalle: string } {
  const mensajes = resp?.messages ?? []
  if (mensajes.length === 0) return { ok: false, detalle: 'Vonage no devolvió mensajes' }
  const fallos = mensajes.filter(m => String(m.status) !== '0')
  if (fallos.length === 0) return { ok: true, detalle: 'aceptado' }
  return {
    ok: false,
    detalle: fallos.map(m => `status ${m.status}: ${m['error-text'] ?? m.errorText ?? 'sin detalle'}`).join('; ')
  }
}
