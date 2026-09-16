import dotenv from 'dotenv'
dotenv.config()

const {
  DATABASE_URL: supabaseUrl = '',
  DB_API_KEY: supabaseKey = '',
  SALT_ROUND = 10,
  SECRET_KEY = 'dev-secret-key-change-in-prod'
} = process.env

export { supabaseUrl, supabaseKey, SALT_ROUND, SECRET_KEY }