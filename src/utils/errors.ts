/** Error de regla de negocio: el mensaje es seguro de mostrar al cliente. */
export class ErrorNegocio extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ErrorNegocio'
    this.status = status
  }
}

export interface RespuestaError {
  data: null
  error: string
  status: number
}

function codigoPg(error: unknown): string | undefined {
  const e = error as { code?: unknown; cause?: { code?: unknown } } | null
  const code = e?.code ?? e?.cause?.code
  return typeof code === 'string' ? code : undefined
}

/**
 * Traduce un error capturado a una respuesta HTTP.
 * - ErrorNegocio: usa su mensaje y status.
 * - Errores de Postgres comunes: 409 (duplicado / FK) o 400 (formato / rango).
 * - Cualquier otro: 500 con el mensaje genérico `fallback`.
 */
export function errorDb(error: unknown, fallback: string): RespuestaError {
  if (error instanceof ErrorNegocio) {
    return { data: null, error: error.message, status: error.status }
  }
  if (error instanceof Error && /no se encontr|no encontrad[oa]/i.test(error.message)) {
    return { data: null, error: error.message, status: 404 }
  }
  switch (codigoPg(error)) {
    case '23505':
      return { data: null, error: 'Ya existe un registro con esos datos', status: 409 }
    case '23503':
      return { data: null, error: 'Referencia inválida o registro en uso', status: 409 }
    case '23502':
      return { data: null, error: 'Falta un dato obligatorio', status: 400 }
    case '23514':
    case '22003':
      return { data: null, error: 'Valor fuera de rango permitido', status: 400 }
    case '22P02':
    case '22007':
    case '22008':
      return { data: null, error: 'Dato con formato inválido', status: 400 }
    default:
      return { data: null, error: fallback, status: 500 }
  }
}

/** Convierte un id de ruta en entero positivo o lanza ErrorNegocio 400. */
export function idValido(valor: unknown, nombre = 'id'): number {
  const n = Number(valor)
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorNegocio(`${nombre} inválido`, 400)
  }
  return n
}
