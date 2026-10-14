import dotenv from 'dotenv'
dotenv.config()

const {
  DATABASE_URL: supabaseUrl = '',
  DB_API_KEY: supabaseKey = '',
  STRIPE_SECRET_KEY = '',
  REDIS_URL = 'redis://localhost:6379',
  NODE_ENV = 'development',
  AWS_REGION = '',
  AWS_ACCESS_KEY_ID = '',
  AWS_SECRET_ACCESS_KEY = '',
  S3_BUCKET_NAME = '',
  SMS = '',
  SMS_SECRET = '',
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

// Coerción robusta: si la env var no es un número válido, usa 10
const SALT_ROUND = Number(process.env.SALT_ROUND) || 10

// Normalización de entorno
const IS_PROD = NODE_ENV === 'production'
const IS_DEV = NODE_ENV === 'development' || NODE_ENV === 'dev' || NODE_ENV === 'test'

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

export {
  supabaseUrl,
  supabaseKey,
  SALT_ROUND,
  SECRET_KEY,
  STRIPE_SECRET_KEY,
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
