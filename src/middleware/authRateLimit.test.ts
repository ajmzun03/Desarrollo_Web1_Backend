import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { crearAuthLimiter } from './authRateLimit.js';

function crearApp(limitor: ReturnType<typeof crearAuthLimiter>) {
  const app = express();
  app.use(express.json());
  app.post('/login', limitor, (req, res) => {
    // Simula credenciales: usuario === 'ok' es correcto
    if (req.body?.usuario === 'ok') res.status(200).json({ ok: true });
    else res.status(401).json({ ok: false });
  });
  return app;
}

function arrancar(app: express.Express): Promise<{ server: Server; url: string }> {
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${port}/login` });
    });
  });
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.status;
}

describe('crearAuthLimiter', () => {
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>(r => (server ? server.close(() => r()) : r()));
    server = undefined;
  });

  it('los aciertos no consumen intentos (skipSuccessfulRequests)', async () => {
    const app = crearApp(crearAuthLimiter({ ventanaMinutos: 15, limite: 2, porIdentificador: true }));
    const ctx = await arrancar(app);
    server = ctx.server;

    // 5 logins correctos seguidos: nunca deben quedar bloqueados
    for (let i = 0; i < 5; i++) {
      expect(await post(ctx.url, { usuario: 'ok' })).toBe(200);
    }
  });

  it('los fallos sí consumen y bloquean al identificador', async () => {
    const app = crearApp(crearAuthLimiter({ ventanaMinutos: 15, limite: 2, porIdentificador: true }));
    const ctx = await arrancar(app);
    server = ctx.server;

    expect(await post(ctx.url, { usuario: 'atacante' })).toBe(401);
    expect(await post(ctx.url, { usuario: 'atacante' })).toBe(401);
    // 3er falto → bloqueado
    expect(await post(ctx.url, { usuario: 'atacante' })).toBe(429);
  });

  it('los fallos de un usuario no bloquean a otro detrás de la misma IP', async () => {
    const app = crearApp(crearAuthLimiter({ ventanaMinutos: 15, limite: 2, porIdentificador: true }));
    const ctx = await arrancar(app);
    server = ctx.server;

    expect(await post(ctx.url, { usuario: 'malo1' })).toBe(401);
    expect(await post(ctx.url, { usuario: 'malo1' })).toBe(401);
    expect(await post(ctx.url, { usuario: 'malo1' })).toBe(429);

    // Otro usuario en la misma IP sigue pudiendo fallar dentro de su cupo
    expect(await post(ctx.url, { usuario: 'malo2' })).toBe(401);
    expect(await post(ctx.url, { usuario: 'ok' })).toBe(200);
  });

  it('limitador por IP solo cuenta todos los identificadores juntos', async () => {
    const app = crearApp(crearAuthLimiter({ ventanaMinutos: 15, limite: 2 }));
    const ctx = await arrancar(app);
    server = ctx.server;

    expect(await post(ctx.url, { usuario: 'a' })).toBe(401);
    expect(await post(ctx.url, { usuario: 'b' })).toBe(401);
    // Mismo IP, tercer fallo (cualquier usuario) → bloqueado
    expect(await post(ctx.url, { usuario: 'c' })).toBe(429);
  });
});
