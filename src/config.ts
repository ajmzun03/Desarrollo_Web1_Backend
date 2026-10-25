import dotenv from 'dotenv'
dotenv.config()

const {
  DATABASE_URL: supabaseUrl = '',
  DB_API_KEY: supabaseKey = '',
  STRIPE_SECRET_KEY = '',
  STRIPE_WEBHOOK_SECRET = '',
  ENABLE_DOCS = '',
  REDIS_URL = 'redis://localhost:6379',
  NODE_ENV = 'development',
  AWS_REGION = '',
  AWS_ACCESS_KEY_ID = '',
  AWS_SECRET_ACCESS_KEY = '',
  S3_BUCKET_NAME = '',
  SMS = '',
  SMS_SECRET = '',
  SMS_DESTINO_PRUEBAS = '',
  SMS_FROM = '',
  OTP_ENVIAR_AMBOS = '',
  OTP_MOSTRAR_EN_LOG = '',
  SMTP_HOST = '',
  SMTP_PORT = '587',
  SMTP_FROM = '"Mc restaurant" <mail@example.com>',
  SMTP_USER = '',
  SMTP_PASS = '',
  APP_NAME = 'COPAC',
  CORS_ORIGINS = '',
  STRIPE_SUCCESS_URL = '',
  STRIPE_CANCEL_URL = ''
} = process.env

// Secretos SIN defaults inseguros: vacíos si no están en el entorno
const SECRET_KEY = process.env.SECRET_KEY ?? ''

// Límite global de peticiones por IP en 15 min (una sucursal comparte IP y las apps hacen polling)
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 600

// Coerción robusta: si la env var no es un número válido, usa 10
const SALT_ROUND = Number(process.env.SALT_ROUND) || 10

// Normalización de entorno: valor por defecto development SOLO si no está definido.
// Un valor desconocido detiene el arranque (falla cerrado): nunca se asume dev.
const ENTORNOS_DEV = new Set(['development', 'dev', 'test'])
const ENTORNOS_PROD = new Set(['production', 'prod'])

const nodoEnvNormalizado = NODE_ENV.trim().toLowerCase()
let IS_PROD: boolean
let IS_DEV: boolean

if (ENTORNOS_DEV.has(nodoEnvNormalizado)) {
  IS_DEV = true
  IS_PROD = false
} else if (ENTORNOS_PROD.has(nodoEnvNormalizado)) {
  IS_DEV = false
  IS_PROD = true
} else {
  throw new Error(
    `NODE_ENV inválido: "${NODE_ENV}". Valores permitidos: ` +
    `development, test (desarrollo) o production (producción).`
  )
}

// Guardia: en producción no se puede arrancar sin secretos obligatorios
if (IS_PROD) {
  const faltantes: string[] = []
  if (!SECRET_KEY) faltantes.push('SECRET_KEY')
  if (!supabaseUrl) faltantes.push('DATABASE_URL')
  if (faltantes.length > 0) {
    throw new Error(
      `Configuración inválida para producción: faltan variables obligatorias: ${faltantes.join(', ')}. ` +
      `Define las variables de entorno antes de arrancar en modo producción.`
    )
  }
}

// Si es true, el código 2FA se envía por SMS Y por correo a la vez (el SMS puede ser aceptado por el
// proveedor y aun así no llegar; el correo asegura una vía de entrega)
const OTP_CANALES_AMBOS = OTP_ENVIAR_AMBOS.trim().toLowerCase() === 'true'

// SOLO DESARROLLO: escribe el código 2FA en el log del servidor (para probar sin SMS ni correo).
// En producción se ignora siempre, aunque la variable esté en true.
const OTP_EN_LOG = !IS_PROD && OTP_MOSTRAR_EN_LOG.trim().toLowerCase() === 'true'

// Swagger UI: siempre en desarrollo; en producción solo si ENABLE_DOCS=true
const DOCS_HABILITADAS = IS_DEV || ENABLE_DOCS.trim().toLowerCase() === 'true'

export {
  supabaseUrl,
  supabaseKey,
  SALT_ROUND,
  RATE_LIMIT_MAX,
  DOCS_HABILITADAS,
  OTP_CANALES_AMBOS,
  OTP_EN_LOG,
  SECRET_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  REDIS_URL,
  NODE_ENV,
  IS_PROD,
  IS_DEV,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
  SMS,
  SMS_SECRET,
  SMS_DESTINO_PRUEBAS,
  SMS_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_FROM,
  SMTP_USER,
  SMTP_PASS,
  APP_NAME,
  CORS_ORIGINS,
  STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL
}
