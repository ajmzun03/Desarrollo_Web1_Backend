import { createClient } from 'redis'
import { REDIS_URL } from '../config.js'
import logger from '../config/logger.js'

export const  redis = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
})

redis.on('error', (err) => console.error('Redis Client Error', err))
redis.on('ready', () => logger.info(`Redis client connected`))

export async function connectRedis() {
  if(!redis.isOpen) await redis.connect()
}