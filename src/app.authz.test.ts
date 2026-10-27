import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// Variables de entorno ANTES de que config.ts se importe
vi.hoisted(() => {
  process.env.SECRET_KEY = 'secreto-de-prueba-authz';
  process.env.NODE_ENV = 'test';
  process.env.RATE_LIMIT_MAX = '100000';
});

// Nada de infraestructura real: la autorización se resuelve antes de tocar BD/Redis/servicios externos
vi.mock('./services/redis.js', () => ({
  redis: { isReady: false, isOpen: false },
  connectRedis: vi.fn(async () => false),
  redisHealth: vi.fn(async () => 'down'),
}));
vi.mock('./model/supabase/db.model.js', () => ({ db: {}, sql: {}, Tx: {} as never }));
vi.mock('./config/stripe.js', () => ({ stripe: {}, testTokenParaTarjeta: () => undefined }));
vi.mock('./services/supabaseAuth.service.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/supabaseAuth.service.js')>()),
  supabaseConfigurado: () => false,
}));
vi.mock('./services/s3.js', () => ({
  uploadFile: vi.fn(),
  urlDeLectura: vi.fn(async (key: string) => `https://firmada.test/${encodeURIComponent(key)}?firma=1`),
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
  ContentType: { PNG: 'image/png', JPEG: 'image/jpeg', JPG: 'image/jpg', GIF: 'image/gif', WEBP: 'image/webp' },
}));
vi.mock('./config/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

import jwt from 'jsonwebtoken';
import app from './app.js';

let server: Server;
let base = '';

const firmar = (payload: Record<string, unknown>) =>
  jwt.sign(payload, 'secreto-de-prueba-authz', { expiresIn: '5m', jwtid: Math.random().toString(36) });

const tokens = {
  cliente: firmar({ id: '9', rol: 'CLIENTE', tipo: 'cliente' }),
  cajero: firmar({ id: '2', rol: 'CAJERO' }),
  cocinero: firmar({ id: '3', rol: 'COCINERO' }),
  repartidor: firmar({ id: '4', rol: 'REPARTIDOR' }),
  temporal2fa: firmar({ id: '1', rol: 'ADMIN', purpose: '2fa' }),
};

async function llamar(metodo: string, ruta: string, token?: string, body: unknown = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(metodo === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
  return res.status;
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

// Rutas que exigen autenticación (cualquier método)
const protegidas: Array<[string, string]> = [
  ['GET', '/pedidos'], ['GET', '/pedidos/1'], ['POST', '/pedidos'], ['PATCH', '/pedidos/1/estado'],
  ['GET', '/clientes'], ['GET', '/clientes/1'], ['PATCH', '/clientes/1'],
  ['GET', '/direcciones'], ['POST', '/direcciones'],
  ['GET', '/usuarios'], ['POST', '/usuarios'], ['PATCH', '/usuarios/1'],
  ['GET', '/turnos'], ['POST', '/turnos/apertura'], ['GET', '/cajas'], ['GET', '/liquidaciones'],
  ['GET', '/facturas-venta'], ['GET', '/facturas-compra'], ['GET', '/gastos-sucursal'],
  ['GET', '/ordenes-compra'], ['GET', '/ordenes-trabajo'], ['PATCH', '/ordenes-trabajo/1/terminar'],
  ['GET', '/proveedores'], ['GET', '/proveedores/1'], ['GET', '/materias-primas'], ['GET', '/materias-primas/1'],
  ['GET', '/bodegas'], ['GET', '/alacenas'], ['POST', '/alacenas/mermas'], ['POST', '/alacenas/traslados'],
  ['POST', '/traslados'], ['POST', '/inventario/cuadre'], ['POST', '/hojas-recepcion'], ['POST', '/hojas-despacho'],
  ['GET', '/stock-bodega'], ['GET', '/kardex-bodega'], ['GET', '/reportes/utilidad-diaria'],
  ['GET', '/repartidor/pedidos'], ['POST', '/archivos/upload-url'], ['POST', '/pagos/checkout'], ['GET', '/auth/me'],
  ['POST', '/auth/logout'], ['DELETE', '/auth/usuarios/1/mfa'], ['GET', '/solicitudes-insumo'], ['GET', '/recetas'],
];

describe('autorización — sin token', () => {
  it.each(protegidas)('%s %s => 401', async (metodo, ruta) => {
    expect(await llamar(metodo, ruta)).toBe(401);
  });

  it('un token temporal de 2FA no autoriza rutas normales', async () => {
    expect(await llamar('GET', '/pedidos', tokens.temporal2fa)).toBe(401);
  });
});

// Rutas SOLO de personal: un token de cliente final jamás debe pasar
const soloPersonal = protegidas.filter(([, r]) =>
  !['/pedidos', '/pedidos/1', '/clientes/1', '/direcciones', '/pagos/checkout'].includes(r)
);

describe('autorización — token de cliente final', () => {
  it.each(soloPersonal)('%s %s => 403', async (metodo, ruta) => {
    expect(await llamar(metodo, ruta, tokens.cliente)).toBe(403);
  });

  it('un cliente no puede ver el listado ni el perfil de otro cliente', async () => {
    expect(await llamar('GET', '/clientes', tokens.cliente)).toBe(403);
    expect(await llamar('GET', '/clientes/1', tokens.cliente)).toBe(403); // el suyo es el 9
    expect(await llamar('PATCH', '/clientes/1', tokens.cliente, { nombre: 'X' })).toBe(403);
  });

  it('un cliente no puede cambiar el estado de un pedido', async () => {
    expect(await llamar('PATCH', '/pedidos/1/estado', tokens.cliente, { estado: 'ENTREGADO' })).toBe(403);
    expect(await llamar('PATCH', '/pedidos/1/confirmar', tokens.cliente)).toBe(403);
  });
});

describe('autorización — por rol de personal', () => {
  it('un CAJERO no administra usuarios ni ve compras', async () => {
    expect(await llamar('GET', '/usuarios', tokens.cajero)).toBe(403);
    expect(await llamar('POST', '/usuarios', tokens.cajero)).toBe(403);
    expect(await llamar('GET', '/facturas-compra', tokens.cajero)).toBe(403);
    expect(await llamar('GET', '/reportes/utilidad-diaria', tokens.cajero)).toBe(403);
  });

  it('un COCINERO no toca inventario de bodega ni finanzas', async () => {
    expect(await llamar('POST', '/traslados', tokens.cocinero)).toBe(403);
    expect(await llamar('POST', '/hojas-recepcion', tokens.cocinero)).toBe(403);
    expect(await llamar('GET', '/gastos-sucursal', tokens.cocinero)).toBe(403);
    expect(await llamar('POST', '/pedidos', tokens.cocinero, { items: [{ producto_id: 1, cantidad: 1 }] })).toBe(403);
  });

  it('un REPARTIDOR no crea hojas de despacho, turnos ni cambia pedidos genéricamente', async () => {
    expect(await llamar('POST', '/hojas-despacho', tokens.repartidor)).toBe(403);
    expect(await llamar('POST', '/turnos/apertura', tokens.repartidor)).toBe(403);
    expect(await llamar('PATCH', '/pedidos/1/estado', tokens.repartidor, { estado: 'ANULADO' })).toBe(403);
  });
});

describe('autorización — vistas del repartidor y roles sin acceso a datos de clientes', () => {
  it('un COCINERO no lee clientes ni direcciones', async () => {
    expect(await llamar('GET', '/clientes/1', tokens.cocinero)).toBe(403);
    expect(await llamar('GET', '/direcciones', tokens.cocinero)).toBe(403);
    expect(await llamar('GET', '/direcciones/1', tokens.cocinero)).toBe(403);
  });

  it('un REPARTIDOR no lista clientes, no ve hojas de despacho ni cajas, y no administra nada', async () => {
    for (const [m, r] of [['GET', '/clientes'], ['GET', '/hojas-despacho'], ['GET', '/cajas'], ['GET', '/usuarios'], ['GET', '/reportes/utilidad-diaria']] as const) {
      expect(await llamar(m, r, tokens.repartidor), m + ' ' + r).toBe(403);
    }
    // crear pedidos: con cuerpo válido, el rol REPARTIDOR no puede
    expect(await llamar('POST', '/pedidos', tokens.repartidor, { cliente_id: 1, items: [{ producto_id: 1, cantidad: 1 }] })).toBe(403);
  });
});

describe('rutas públicas y manejo de errores', () => {
  it('/health responde sin autenticación', async () => {
    expect(await llamar('GET', '/health')).toBe(200);
  });

  it('el webhook de Stripe sin secreto configurado responde 503 (no 404 ni 500)', async () => {
    expect(await llamar('POST', '/pagos/webhook')).toBe(503);
  });

  it('JSON mal formado => 400 (no 500)', async () => {
    const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malo' });
    expect(res.status).toBe(400);
  });

  it('origen CORS no permitido => 403', async () => {
    const res = await fetch(`${base}/health`, { headers: { Origin: 'http://evil.example' } });
    expect(res.status).toBe(403);
  });

  it('cada respuesta trae X-Request-Id y respeta el que envía el proxy', async () => {
    const r1 = await fetch(`${base}/health`);
    expect(r1.headers.get('x-request-id')).toMatch(/[\w-]{8,}/);
    const r2 = await fetch(`${base}/health`, { headers: { 'X-Request-Id': 'abc-12345678' } });
    expect(r2.headers.get('x-request-id')).toBe('abc-12345678');
  });

  it('no expone X-Powered-By', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});

describe('GET /archivos/imagen (pública, solo catálogo)', () => {
  const url = (key?: string) => `${base}/archivos/imagen${key === undefined ? '' : `?key=${encodeURIComponent(key)}`}`;

  it('no exige autenticación y redirige (302) a la URL firmada', async () => {
    const res = await fetch(url('productos/combos/Combo Bacon.jpg'), { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('firma=1');
  });

  it('permite que un <img> de otro origen la cargue y la cachea menos que la firma', async () => {
    const res = await fetch(url('productos/a.jpg'), { redirect: 'manual' });
    expect(res.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it.each(['uploads/secreto.jpg', 'productos/../uploads/a.jpg', 'productos/lista.pdf', ''])('rechaza la clave %j con 400', async (key) => {
    const res = await fetch(url(key), { redirect: 'manual' });
    expect(res.status).toBe(400);
  });

  it('sin clave => 400, y con la clave repetida (arreglo) => 400', async () => {
    expect((await fetch(url(), { redirect: 'manual' })).status).toBe(400);
    const res = await fetch(`${base}/archivos/imagen?key=productos/a.jpg&key=productos/b.jpg`, { redirect: 'manual' });
    expect(res.status).toBe(400);
  });
});
