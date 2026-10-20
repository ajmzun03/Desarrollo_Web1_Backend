import app from './app.js';
import logger from './config/logger.js';
import { connectRedis, redis } from './services/redis.js';
import { sql } from './model/supabase/db.model.js';

const PORT = process.env.PORT ?? 3000;

async function main() {
  const redisOk = await connectRedis()
  if (!redisOk) {
    logger.warn('Servidor iniciado SIN Redis: sesiones en memoria y caché desactivada')
  }
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Servidor corriendo');
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

  // Cierre ordenado: deja de aceptar conexiones, termina las en curso y libera Redis y la BD.
  let cerrando = false
  const apagar = (senial: string) => {
    if (cerrando) return
    cerrando = true
    logger.info({ senial }, 'Cerrando servidor')
    const forzar = setTimeout(() => process.exit(1), 10_000)
    forzar.unref()
    server.close(async () => {
      try {
        await Promise.allSettled([redis.isOpen ? redis.quit() : Promise.resolve(), sql.end({ timeout: 5 })])
      } finally {
        process.exit(0)
      }
    })
  }
  process.on('SIGTERM', () => apagar('SIGTERM'))
  process.on('SIGINT', () => apagar('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandledRejection')
})
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException')
  process.exit(1)
})

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
})
