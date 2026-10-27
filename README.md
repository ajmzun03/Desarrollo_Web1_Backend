# COPAC API

API REST para el sistema de gestión del restaurante COPAC. Construida con **Express 5**, **Drizzle ORM** (Postgres/Supabase), **Redis** y **TypeScript**.

## Requisitos

- Node.js 22+
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

- Swagger UI: `GET /docs` (siempre en desarrollo; en producción solo con `ENABLE_DOCS=true`)
- Health check: `GET /health`

## Arquitectura breve

```
src/
  index.ts            # montaje de Express, rutas, middlewares globales
  config.ts           # carga de env vars + guardia de producción
  middleware/         # auth (JWT), cors, cache, rate-limit, validación
  routes/             # un router por recurso
  controllers/        # lógica de negocio por recurso
  services/           # lógica transaccional (inventario, pedidos, Supabase Auth/MFA, Redis)
  model/supabase/     # acceso a datos (Drizzle)
  schemas/            # schemas Zod + definiciones Drizzle
```

### Autenticación

- **Staff** (`/auth/*`): contraseña (bcrypt) + segundo factor **TOTP** (app autenticadora) gestionado por Supabase Auth MFA.
  1. `POST /auth/login` → `202 { requiereVerificacion, mfa: "verificar" | "enrolar", tmpToken }` (10 min).
  2. Primera vez (`mfa = "enrolar"`): `POST /auth/mfa/enrolar { tmpToken }` → `{ qrCode, secret, uri }` para escanear.
  3. `POST /auth/verificar { tmpToken, codigo }` → `200 { usuario, token, vistas }`. Tras 5 códigos incorrectos la sesión pendiente se destruye (429).
  - La sesión de Supabase nunca llega al navegador: se guarda en el servidor (Redis, 10 min). **Redis es obligatorio en producción**; sin él el login responde 503.
  - Recuperar contraseña: `POST /auth/recuperar` envía un correo (Supabase) con un enlace `...?token_hash=XXXX&type=recovery`; `POST /auth/restablecer { tokenHash, nuevaContrasenia }`. Restablecer **no** quita el autenticador.
  - `DELETE /auth/usuarios/:id/mfa` (solo ADMIN) reinicia el autenticador de quien perdió su teléfono y cierra sus sesiones.
- **Clientes** (`/cliente/auth/*`): correo y contraseña, **sin segundo factor**. `POST /cliente/auth/login` → `200 { cliente, token }`. Recuperación por correo igual que el personal (`PASSWORD_RESET_URL_CLIENTE`).
- Rutas protegidas usan `Authorization: Bearer <token>`. Los tokens temporales de verificación (`purpose`) **no** autorizan rutas normales.
- Un token de **cliente** nunca sirve en rutas de personal: `requireRole`/`staffOnly` lo rechazan con 403. Un cliente solo ve y modifica sus propios pedidos, direcciones y perfil.
- **Sesiones**: `POST /auth/logout` y `POST /cliente/auth/logout` revocan el token (por `jti`); desactivar a un usuario (`PATCH /usuarios/:id {activo:false}`) o cambiar su contraseña cierra todas sus sesiones. La revocación requiere Redis; sin Redis solo aplica la expiración del token (1 día).
- Los límites por IP de Supabase Auth se comparten entre todo el personal (las llamadas salen de la IP del servidor): en el panel de Supabase conviene subir los límites de MFA y de verificación.

### Imágenes

El bucket de S3 es **privado**: abrir directamente `imagen_url` (producto) o `imagen` (combo) responde 403. Para mostrarlas, el frontend usa `GET /archivos/imagen?key=<ruta del objeto>` (público, limitado a `productos/` y a extensiones de imagen), que responde `302` a una URL firmada de 15 minutos. La clave es la ruta de la URL guardada en la base, por ejemplo `productos/combos/Combo Bacon.jpg`.

### Pagos

`POST /pagos/checkout` y `POST /pagos/payment-intent` requieren autenticación de cliente y solo permiten pagar pedidos propios, vigentes, sin pagar y con `metodo_pago = TARJETA`. El monto sale siempre de `pedido.total`.

`POST /pagos/webhook` (sin autenticación; valida la firma `Stripe-Signature` con `STRIPE_WEBHOOK_SECRET`) marca el pedido como `pagado` solo si el monto cobrado coincide con el total. Un pedido con tarjeta no puede confirmarse (`PATCH /pedidos/:id/confirmar`) hasta estar pagado. En local: `stripe listen --forward-to localhost:3000/pagos/webhook`.

### Reglas de negocio importantes

- **Pedidos**: precios y total siempre del catálogo del servidor; productos inexistentes/inactivos se rechazan. Soportan `direccion_id`, `sucursal_id`, `metodo_pago`, `tipo_entrega` y `extras` por ítem. Los cambios de estado siguen una máquina de estados (`CREADO → LISTO → EN_RUTA/EN_DESPACHO → ENTREGADO`, `ANULADO` desde cualquier estado no final).
- **Recepción de mercadería** (`POST /hojas-recepcion`): requiere `bodega_id` (de la sucursal receptora); crea el lote, su fila en `STOCK_BODEGA` y el kardex. Una recepción `TOTAL` sobre una orden de compra `EN_PREPARACION` la finaliza.
- **Traslados**: bodega→bodega (`POST /traslados`) y bodega→alacena (`POST /alacenas/traslados`). Todas las operaciones de inventario bloquean los lotes (`FOR UPDATE`) dentro de una transacción.
- **Producción** (`PATCH /ordenes-trabajo/:id/terminar`): descuenta la materia prima de la receta (alacena y luego bodega, FEFO, sin lotes vencidos) y crea el lote de producto. Cantidad por ingrediente = `cantidad_necesaria × cantidad_produccion / cantidad_lote`. Finalizar solo es posible por `/terminar`.
- **Despacho** (`POST /hojas-despacho`): exige ítems, valida lotes vigentes y cantidades contra el pedido, descuenta el stock y asigna `repartidor_id` (obligatorio a domicilio). El pedido pasa a `EN_RUTA` (domicilio) o `EN_DESPACHO`.
- **Facturas de venta**: una por pedido; el total sale del pedido.
- **Combos**: un ítem de pedido puede ser `combo_id`; se cobra el precio del combo y se expande en sus productos (para stock y despacho).
- **Reembolsos**: anular un pedido pagado con tarjeta lo reembolsa en Stripe; si falla, el pedido no se anula.
- **Logs**: cada petición lleva `X-Request-Id` y se registra una línea por petición (sin cuerpos ni credenciales).

Guía completa de flujos y permisos para frontend: [docs/FLUJOS_API.md](./docs/FLUJOS_API.md).

## Tests

```bash
pnpm test
```

## Notas de seguridad

- No commitear `.env` ni `dist/`.
- En producción se exige `SECRET_KEY` y `DATABASE_URL`; sin ellos el proceso no arranca.
- `CORS_ORIGINS` debe definirse en producción (lista explícita, sin `*`).
- Redis caído en producción bloquea el login 2FA (503) en lugar de degradar a login sin segundo factor.
