# COPAC API

API REST para el sistema de gestión del restaurante COPAC. Construida con **Express 5**, **Drizzle ORM** (Postgres/Supabase), **Redis** y **TypeScript**.

## Requisitos

- Node.js 20+
- pnpm 9+
- Una instancia de Supabase/Postgres
- Redis (obligatorio en producción para 2FA; opcional en dev)

## Instalación

```bash
pnpm install
cp .env.example .env   # y completa las variables
```

## Variables de entorno

Ver [.env.example](./.env.example). En **producción** la app no arranca si faltan `SECRET_KEY` o `DATABASE_URL`.

## Desarrollo

```bash
pnpm dev          # servidor con recarga (tsx watch)
pnpm test         # tests (vitest)
pnpm build        # compila a dist/
pnpm start        # arranca el build (dist/index.js)
pnpm redis:check  # verifica conectividad con Redis
```

## Documentación

- Swagger UI: `GET /docs` (cuando el servidor está corriendo)
- Health check: `GET /health`

## Arquitectura breve

```
src/
  index.ts            # montaje de Express, rutas, middlewares globales
  config.ts           # carga de env vars + guardia de producción
  middleware/         # auth (JWT), cors, cache, rate-limit, validación
  routes/             # un router por recurso
  controllers/        # lógica de negocio por recurso
  services/           # lógica transaccional (inventario, pedidos, OTP, Redis)
  model/supabase/     # acceso a datos (Drizzle)
  schemas/            # schemas Zod + definiciones Drizzle
```

### Autenticación

- **Staff** (`/auth/*`): login con 2FA por SMS/email. `POST /auth/login` → 202 con `tmpToken` → `POST /auth/verificar` → token de sesión.
- **Clientes** (`/cliente/auth/*`): mismo flujo con tokens marcados `tipo: 'cliente'`.
- Rutas protegidas usan `Authorization: Bearer <token>`. Tokens temporales de 2FA (`purpose`) **no** autorizan rutas normales.

### Pagos

`POST /pagos/checkout` y `POST /pagos/payment-intent` requieren autenticación de cliente y solo permiten pagar pedidos propios (`cliente_id` coincide). Los montos se calculan en el servidor cuando se asocia un `pedido_id`.

## Tests

```bash
pnpm test
```

## Notas de seguridad

- No commitear `.env` ni `dist/`.
- En producción se exige `SECRET_KEY` y `DATABASE_URL`; sin ellos el proceso no arranca.
- `CORS_ORIGINS` debe definirse en producción (lista explícita, sin `*`).
- Redis caído en producción bloquea el login 2FA (503) en lugar de degradar a login sin segundo factor.
