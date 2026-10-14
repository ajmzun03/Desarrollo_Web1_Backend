import { createClient } from 'redis';
import { config } from 'dotenv';

config();

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
const client = createClient({ url, socket: { connectTimeout: 4000, reconnectStrategy: false } });

client.on('error', () => {});

try {
  await client.connect();
  const pong = await client.ping();
  if (pong !== 'PONG') throw new Error(`Respuesta inesperada: ${pong}`);

  await client.set('health:check', 'ok', { EX: 10 });
  const val = await client.get('health:check');
  if (val !== 'ok') throw new Error(`SET/GET falló: ${val}`);
  await client.del('health:check');

  console.log(`OK — Redis responde en ${url} (PING, SET/GET verificados)`);
  process.exit(0);
} catch (err) {
  console.error(`FALLO — Redis no responde en ${url}: ${err.message}`);
  process.exit(1);
}
