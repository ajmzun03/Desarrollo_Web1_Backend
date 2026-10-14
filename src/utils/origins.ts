import { CORS_ORIGINS, IS_PROD } from '../config.js'

// Lista por defecto cuando CORS_ORIGINS no está definida (solo dev)
const ORIGENES_DEV = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://desarrollo-web1-backend.onrender.com'
]

/**
 * Orígenes aceptados por CORS. En producción DEBE definirse CORS_ORIGINS
 * (separado por coma). En dev se usa la lista local si la env var está vacía.
 * Nunca se usa '*' (inseguro con credentials).
 */
function obtenerOrigenes(): string[] {
  if (CORS_ORIGINS.trim()) {
    return CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  }
  // En producción, sin CORS_ORIGINS no hay orígenes permitidos (falla cerrado)
  if (IS_PROD) return []
  return ORIGENES_DEV
}

export const ACCEPTED_ORIGINS = obtenerOrigenes()
