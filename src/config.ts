import dotenv from 'dotenv'
dotenv.config()

const {
  DATABASE_URL: supabaseUrl = '',
  DB_API_KEY: supabaseKey = '',
  SALT_ROUND = 10,
  SECRET_KEY = 'dev-secret-key-change-in-prod',
  STRIPE_SECRET_KEY = '',
  SESSION_SECRET = 'dev-session-secret-change-in-prod',
  REDIS_URL = 'redis://localhost:6379',
  NODE_ENV = 'dev'
} = process.env

export { supabaseUrl, supabaseKey, SALT_ROUND, SECRET_KEY, STRIPE_SECRET_KEY, SESSION_SECRET, REDIS_URL, NODE_ENV }