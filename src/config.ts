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
  NODE_ENV = 'dev',
  AWS_REGION = 'us-east-1',
  AWS_ACCESS_KEY_ID = 'AKIAQ7CBAJ2R6X3K6Q4Y',
  AWS_SECRET_ACCESS_KEY = 'SECRET_ACCESS_KEY',
  S3_BUCKET_NAME = 'bucket-name',
} = process.env

export {
  supabaseUrl,
  supabaseKey,
  SALT_ROUND,
  SECRET_KEY,
  STRIPE_SECRET_KEY,
  SESSION_SECRET,
  REDIS_URL,
  NODE_ENV,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME
}