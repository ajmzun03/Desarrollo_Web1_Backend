# Guía de Pruebas Funcionales — API Restaurant

Documento operativo para probar **todos los endpoints** del backend de la API Restaurant
(Express 5 + TypeScript + Drizzle + Supabase/Postgres + Stripe).

> Los IDs citados como "existentes" fueron **verificados en vivo** contra la base de datos
> (18/09/2026). Los bodies de los POST son **datos nuevos** creados solo para prueba.
> Para los POST que devuelven objetos con autoincrement, el `id` de la respuesta será el
> siguiente disponible.

---

## 1. Inicio rápido

| Paso | Comando / acción |
|---|---|
| Requisitos | Node 18+ instalado |
| Dependencias | `npm install --legacy-peer-deps` |
| Variables | `.env` ya contiene `DATABASE_URL` y `STRIPE_SECRET_KEY` |
| Arrancar servidor | `npm run dev` (puerto `3000`) |
| Swagger UI | http://localhost:3000/docs |
| Verificación | `GET http://localhost:3000/` → `200` |

Headers de seguridad visibles en cualquier respuesta:

```
X-Content-Type-Options: nosniff          # helmet activo
X-Powered-By: <NO debe existir>          # desactivado
```

---

## 2. Autenticación

### 2.1 Login

```
POST /auth/login
Content-Type: application/json

{ "usuario": "admin.mc", "contrasenia": "umg123" }
```

Respuesta 200:

```json
{
  "data": {
    "usuario": { "id": 1, "usuario": "admin.mc", "rol": "ADMIN" },
    "token": "eyJhbGciOi..."
  },
  "error": null
}
```

> El token expira en **24 h** (`exp`). Guardarlo y usarlo en toda request protegida:

```
Authorization: Bearer eyJhbGciOi...
```

### 2.2 Otros endpoints de auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | Login, devuelve `{ usuario, token }` |
| POST | `/auth/logout` | Token | Cierra sesión (invalida el JWT en memoria/BD) |
| GET | `/auth/me` | Token | Devuelve el usuario autenticado |

### 2.3 Usuarios existentes por rol (para pruebas de roles / 403)

| id | usuario | rol |
|---|---|---|
| 1 | `admin.mc` | ADMIN (**credenciales conocidas**: `umg123`) |
| 10 | `admin.operaciones` | ADMIN |
| 2 | `bodega.central` | BODEGUERO |
| 7 | `bodega.zona2` | BODEGUERO |
| 3 | `despacho.zona1` | DESPACHADOR |
| 8 | `despacho.zona2` | DESPACHADOR |
| 4 | `reparto.juan` | REPARTIDOR |
| 9 | `reparto.carlos` | REPARTIDOR |
| 5 | `caja.zona1` | CAJERO |
| 6 | `caja.zona2` | CAJERO |

> Solo `admin.mc / umg123` tiene contraseña documentada. Para validar el **403** de un rol
> distinto se necesita loguearse como ese usuario (usar Swagger `POST /auth/login`, o
> preestablecer su contraseña en BD vía Supabase).

---

## 3. Datos reales disponibles en BD

IDs usables en rutas con `:id` (GET / PATCH / acciones):

| Entidad | IDs existentes | Nota |
|---|---|---|
| Municipios | 1–10 | `GET /municipios` + `GET /municipios/departamentos` |
| Sucursales | 1–10 | `sucursal_id=1` = zona principal |
| Categorías | 1–3 | `categoria_id=1` |
| Unidades de medida | 1–10 | `unidad_medida_id=1` |
| Bodegas | 1–10 | `bodega_id=1` |
| Alacenas | 1–10 | `alacena_id=1` |
| Proveedores | 1–3 | `proveedor_id=1` |
| Materias primas | 1–10 | `materia_prima_id=1` |
| Productos | 1–10, **13** | 1=`Big Mac` 48, 2=`Cuarto de Libra` 45, 3=`McPollo` 42, 5=`Papas Fritas Medianas` 22 |
| Clientes | 1–10 | 1=`Ana López` tel `55510001`, 2=`Carlos Méndez` `55510002` |
| Pedidos | 1–11 | `GET /pedidos/1` trae `detalles[]` |
| Recetas | 1–10 | `GET /recetas/1` trae `detalles[]` |
| Direcciones | 1–10 | |
| Turnos | 1–10 | |
| Cajas | 1–10 | |
| Gastos sucursal | 1–10 | |
| Órdenes de trabajo | 1–10 | |
| Órdenes de compra | 1–10 | |
| Facturas de compra | 1–10 | |
| Facturas de venta | 1–10 | |
| Hojas de recepción | 1–10 | |
| Hojas de despacho | 1–10 | |
| Liquidaciones | 1–10 | |
| Stock bodega / alacena | 1–10 | |
| Kardex bodega / alacena | 1–10 | |

---

## 4. Módulo por módulo

Formato de respuesta estándar:

```json
{ "data": <objeto|array|null>, "error": <string|null> }
```

Estados: `201` al crear, `200` en el resto. `400` = validación Zod, `401` = sin/Token inválido,
`403` = rol no permitido, `404` = no encontrado, `429` = rate limit.

### 4.1 AUTH

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| POST | `/auth/login` | — | `{ "usuario":"admin.mc", "contrasenia":"umg123" }` | 200 + token |
| POST | `/auth/logout` | Token | — | 200/204 |
| GET | `/auth/me` | Token | — | 200 + usuario |

### 4.2 USUARIOS

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/usuarios` | Token | — | 200 `array[10]` |
| GET | `/usuarios/:id` | Token | — (usar `1` o `10`) | 200 |
| GET | `/usuarios/99999` | Token | — | 404 `Usuario no encontrado` |
| POST | `/usuarios` | Token | `{ "usuario":"test.cajero", "correo_electronico":"test.cajero@empresa.local", "contrasenia":"Prueba123!", "rol":"CAJERO" }` | 201 |
| PATCH | `/usuarios/:id` | Token | `{ "rol": "BODEGUERO" }` | 200 |

Rol válido (enum): `ADMIN | BODEGUERO | DESPACHADOR | REPARTIDOR | CAJERO`.
Contraseña: mínimo 8 caracteres.

### 4.3 CLIENTES

| Método | Ruta | Auth | Body / query | Esperado |
|---|---|---|---|---|
| GET | `/clientes` | Token | — | 200 `array[10]` |
| GET | `/clientes?telefono=55510001` | Token | — | 200 (filtro por teléfono) |
| GET | `/clientes/1` | Token | — | 200 `Ana López` |
| GET | `/clientes/99999` | Token | — | 404 `Cliente no encontrado` |
| POST | `/clientes` | Token | `{ "nombre":"Pedro","apellido":"Ramírez","telefono":"55559999","telefono_ref":"55558888" }` | 201 |
| PATCH | `/clientes/:id` | Token | `{ "telefono":"55557777" }` (parcial) | 200 |

Validaciones: nombre/apellido ≥ 3; teléfono = **exactamente 8 dígitos**; `telefono_ref` ≠ `telefono`.

### 4.4 CATEGORÍAS

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/categorias` | **Público** | — | 200 `array[3]` |
| GET | `/categorias/1` | **Público** | — | 200 |
| GET | `/categorias/99999` | **Público** | — | 404 `Categoría no encontrada` |
| POST | `/categorias` | Token ADMIN | `{ "categoria_id": 100, "descripcion": "Categoría Test Nueva" }` | 201 |
| PATCH | `/categorias/1` | Token ADMIN | `{ "descripcion": "Actualizada" }` | 200 |

### 4.5 UNIDADES DE MEDIDA

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/unidades-medida` | **Público** | — | 200 `array[10]` |
| GET | `/unidades-medida/1` | **Público** | — | 200 |
| POST | `/unidades-medida` | Token ADMIN | `{ "unidad":"Kilogramo", "abreviatura":"KG" }` | 201 |
| PATCH | `/unidades-medida/1` | Token ADMIN | `{ "abreviatura":"KILO" }` | 200 |

Abreviatura: máx 5 caracteres.

### 4.6 PROVEEDORES

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/proveedores` | **Público** | — | 200 `array[3]` |
| GET | `/proveedores/1` | **Público** | — | 200 |
| POST | `/proveedores` | Token ADMIN | `{ "no_nit":"12345678", "proveedor":"Proveedor Test SA", "direccion":"Av. Principal 123" }` | 201 |
| PATCH | `/proveedores/1` | Token ADMIN | `{ "proveedor":"Nombre Actualizado" }` | 200 |

NIT: solo dígitos, entre 8 y 13.

### 4.7 SUCURSALES

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/sucursales` | **Público** | — | 200 `array[10]` |
| GET | `/sucursales/1` | **Público** | — | 200 |
| POST | `/sucursales` | Token ADMIN | `{ "municipio_id": 1, "sucursal": "Sucursal Test Nueva" }` | 201 |
| PATCH | `/sucursales/1` | Token ADMIN | `{ "sucursal": "Sucursal Actualizada" }` | 200 |

### 4.8 MUNICIPIOS

| Método | Ruta | Auth | Esperado |
|---|---|---|---|
| GET | `/municipios` | **Público** | 200 `array[10]` |
| GET | `/municipios/departamentos` | **Público** | 200 (departamentos) |

> No existe `/departamentos` suelto: los departamentos viven en `/municipios/departamentos`.

### 4.9 MATERIAS PRIMAS

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/materias-primas` | **Público** | — | 200 `array[10]` |
| GET | `/materias-primas/1` | **Público** | — | 200 |
| POST | `/materias-primas` | Token ADMIN/BODEGUERO | `{ "categoria_id":1, "unidad_medida_id":1, "materia_prima":"Harina de Trigo", "es_perecedera":false, "maneja_merma":false }` | 201 |
| PATCH | `/materias-primas/1` | Token ADMIN/BODEGUERO | `{ "maneja_merma": true }` | 200 |

`es_perecedera` y `maneja_merma` son **booleanos** (no strings).

### 4.10 PRODUCTOS

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/productos` | **Público** | — | 200 `array[11]` |
| GET | `/productos/1` | **Público** | — | 200 |
| GET | `/productos/disponibilidad` | **Público** | `?sucursal_id=1` | 200 `array[11]` |
| GET | `/productos/99999` | **Público** | — | 404 |
| POST | `/productos` | Token ADMIN/BODEGUERO | `{ "categoria_id":1, "unidad_medida_id":1, "producto":"Nachos", "precio":35 }` | 201 |
| PATCH | `/productos/1` | Token ADMIN/BODEGUERO | `{ "precio": 45, "producto":"Big Mac Especial" }` (strict) | 200 |
| PATCH | `/productos/1/stock-minimo` | Token ADMIN | `{ "stock_minimo": 10 }` | 200 |

> `PATCH /productos/:id` usa `.strict()`: una propiedad extra → 400 `Unrecognized key(s)`.

### 4.11 BODEGAS / ALACENAS

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/bodegas` | Token | — | 200 `array[10]` |
| GET | `/bodegas/1` | Token | — | 200 |
| GET | `/bodegas/lotes/fefo` | Token BODEGUERO/ADMIN | — | 200 (inventario FEFO) |
| POST | `/bodegas` | Token ADMIN/BODEGUERO | `{ "sucursal_id":1, "bodega":"Bodega Test" }` | 201 |
| PATCH | `/bodegas/1` | Token ADMIN/BODEGUERO | `{ "bodega":"Bodega Actualizada" }` (strict) | 200 |
| GET | `/alacenas` | Token | — | 200 `array[10]` |
| GET | `/alacenas/1` | Token | — | 200 |
| POST | `/alacenas` | Token ADMIN/BODEGUERO | `{ "bodega_id":1, "alacena":"Alacena Test" }` | 201 |
| PATCH | `/alacenas/1` | Token ADMIN/BODEGUERO | `{ "alacena":"Alacena Actualizada" }` (strict) | 200 |

### 4.12 CAJAS

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/cajas` | Token | — | 200 `array[10]` |
| GET | `/cajas/1` | Token | — | 200 |
| POST | `/cajas` | Token ADMIN | `{ "sucursal_id":1, "nombre":"Caja Test", "tipo":"CAJA_CHICA" }` | 201 |
| PATCH | `/cajas/1` | Token ADMIN | `{ "nombre":"Caja Renombrada" }` (strict) | 200 |

Tipo (enum): `CAJA_CHICA | GASTOS_REPRESENTACION | TRANSITO`.

### 4.13 DIRECCIONES

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/direcciones` | Token | — | 200 `array[10]` |
| GET | `/direcciones/1` | Token | — | 200 |
| POST | `/direcciones` | Token ADMIN | `{ "cliente_id":1, "municipio_id":1, "direccion1":"Av. Principal 123", "direccion2":"Casa color azul" }` | 201 |
| PATCH | `/direcciones/1` | Token ADMIN | `{ "direccion2":"Casa verde" }` (strict) | 200 |

### 4.14 PEDIDOS

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/pedidos` | Token | — | 200 `array[11]` |
| GET | `/pedidos/listos` | Token DESPACHADOR/ADMIN | — | 200 (estado `LISTO`) |
| GET | `/pedidos/1` | Token | — | 200 con `detalles[]` |
| GET | `/pedidos/99999` | Token | — | 404 `Pedido no encontrado` |
| POST | `/pedidos` | Token | ver body abajo | 201 |
| PATCH | `/pedidos/:id/estado` | Token ADMIN | `{ "estado":"EN_RUTA" }` | 200 |
| PATCH | `/pedidos/:id/confirmar` | Token ADMIN/CAJERO | — | 200 (→ `LISTO`) |
| PATCH | `/pedidos/:id/entregado` | Token DESPACHADOR/REPARTIDOR | — | 200 (→ `ENTREGADO`) |

**POST /pedidos** — body nuevo (usa cliente y productos existentes):

```json
{
  "cliente_id": 1,
  "observaciones": "Sin cebolla",
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 5, "cantidad": 1 }
  ]
}
```

Estado (enum): `CREADO | LISTO | ANULADO | EN_RUTA | ENTREGADO`.

> Flujo recomendado de pedido: `POST /pedidos` → `PATCH /pedidos/:id/confirmar` (LISTO)
> → `PATCH /pedidos/:id/entregado` (ENTREGADO). Anular con `PATCH /:id/estado {estado:"ANULADO"}`.

### 4.15 FACTURAS DE VENTA

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/facturas-venta` | Token | — | 200 `array[10]` |
| GET | `/facturas-venta/1` | Token | — | 200 |
| POST | `/facturas-venta` | Token CAJERO/ADMIN | `{ "pedido_id":1, "serie":"A", "numero":"001", "total":150 }` | 201 |

### 4.16 FACTURAS DE COMPRA

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/facturas-compra` | Token | — | 200 `array[10]` |
| GET | `/facturas-compra/1` | Token | — | 200 |
| POST | `/facturas-compra` | Token ADMIN | `{ "hoja_recepcion_id":1, "serie":"B", "numero":"001", "fecha_emision":"2026-09-18", "total":500 }` | 201 |

### 4.17 RECETAS

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/recetas` | Token | — | 200 `array[10]` |
| GET | `/recetas/1` | Token | — | 200 con `detalles[]` |
| GET | `/recetas/99999` | Token | — | 404 |
| POST | `/recetas` | Token ADMIN | ver body abajo | 201 |
| PATCH | `/recetas/1` | Token ADMIN | `{ "cantidad_lote": 25 }` (strict) | 200 |

**POST /recetas** — body nuevo:

```json
{
  "producto_id": 1,
  "nombre": "Receta Big Mac Test",
  "cantidad_lote": 10,
  "items": [
    { "materia_prima_id": 1, "cantidad_necesaria": 5.5 }
  ]
}
```

### 4.18 ÓRDENES DE TRABAJO

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/ordenes-trabajo` | Token | — | 200 `array[10]` |
| GET | `/ordenes-trabajo/cola` | Token | — | 200 (pendientes) |
| GET | `/ordenes-trabajo/1` | Token | — | 200 |
| GET | `/ordenes-trabajo/1/receta` | Token | — | 200 (receta asociada) |
| POST | `/ordenes-trabajo` | Token ADMIN | `{ "sucursal_id":1, "receta_id":1, "cantidad_produccion":20 }` | 201 |
| PATCH | `/ordenes-trabajo/:id/estado` | Token ADMIN | `{ "estado":"EN_PROCESO" }` | 200 |
| PATCH | `/ordenes-trabajo/:id/iniciar` | Token ADMIN | — | 200 |
| PATCH | `/ordenes-trabajo/:id/terminar` | Token ADMIN | — | 200 |

Estado (enum): `GENERADA | EN_PROCESO | ANULADA | FINALIZADA`.

### 4.19 ÓRDENES DE COMPRA

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/ordenes-compra` | Token | — | 200 `array[10]` |
| GET | `/ordenes-compra/programadas` | Token BODEGUERO/ADMIN | — | 200 |
| GET | `/ordenes-compra/1` | Token | — | 200 |
| POST | `/ordenes-compra` | Token ADMIN | ver body abajo | 201 |
| PATCH | `/ordenes-compra/:id/agendar` | Token ADMIN | — | 200 |
| PATCH | `/ordenes-compra/:id/estado` | Token ADMIN | `{ "estado":"EN_PROCESO" }` | 200 |

**POST /ordenes-compra** — body nuevo:

```json
{
  "proveedor_id": 1,
  "sucursal_destino": 1,
  "items": [
    { "materia_prima_id": 1, "cantidad_solicitada": 50, "precio_unitario": 12.50 }
  ]
}
```

Estado (enum): `CREADA | EN_PROCESO | FINALIZADO | ANULADO`.

### 4.20 HOJAS DE RECEPCIÓN (entrada de materia prima)

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/hojas-recepcion` | Token BODEGUERO/ADMIN | — | 200 `array[10]` |
| GET | `/hojas-recepcion/1` | Token BODEGUERO/ADMIN | — | 200 |
| POST | `/hojas-recepcion` | Token BODEGUERO/ADMIN | ver body abajo | 201 |

**POST /hojas-recepcion** — body nuevo:

```json
{
  "sucursal_receptora": 1,
  "tipo_recepcion": "TOTAL",
  "items": [
    { "materia_prima_id": 1, "cantidad_recibida": 50, "fecha_vencimiento": "2026-12-31" }
  ]
}
```

`tipo_recepcion` (enum): `TOTAL | PARCIAL`. La `fecha_vencimiento` **no puede ser pasada**.

### 4.21 HOJAS DE DESPACHO

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/hojas-despacho` | Token DESPACHADOR/ADMIN | — | 200 `array[10]` |
| GET | `/hojas-despacho/1` | Token DESPACHADOR/ADMIN | — | 200 |
| POST | `/hojas-despacho` | Token DESPACHADOR/ADMIN | `{ "pedido_id": 1, "sucursal_despacho": 1 }` | 201 |

### 4.22 STOCK Y KARDEX

| Método | Ruta | Auth | Esperado |
|---|---|---|---|
| GET | `/stock-bodega` | Token BODEGUERO/ADMIN | 200 `array[10]` |
| GET | `/stock-alacena` | Token BODEGUERO/ADMIN | 200 `array[10]` |
| GET | `/kardex-bodega` | Token ADMIN | 200 `array[10]` |
| GET | `/kardex-alacena` | Token ADMIN | 200 `array[10]` |

### 4.23 TURNOS (caja)

| Método | Ruta | Auth | Body | Esperado |
|---|---|---|---|---|
| GET | `/turnos` | Token | — | 200 `array[10]` |
| GET | `/turnos/pendientes-validacion` | Token ADMIN | — | 200 |
| GET | `/turnos/1` | Token | — | 200 |
| POST | `/turnos/apertura` | Token DESPACHADOR/ADMIN | `{ "caja_id":1, "usuario_id":4, "monto_apertura":500 }` | 201 |
| PATCH | `/turnos/:id/cierre` | Token DESPACHADOR/ADMIN | `{ "monto_cierre_declarado":450 }` | 200 |
| PATCH | `/turnos/:id/validar` | Token ADMIN | `{ "monto_cierre_sistema":450 }` | 200 |

`administrador_id` es opcional en la apertura.

### 4.24 GASTOS DE SUCURSAL

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/gastos-sucursal` | Token | — | 200 `array[10]` |
| GET | `/gastos-sucursal/1` | Token | — | 200 |
| POST | `/gastos-sucursal` | Token ADMIN | `{ "sucursal_id":1, "monto_apertura":100 }` | 201 |

### 4.25 LIQUIDACIONES (repartidores)

| Método | Ruta | Auth | Body (nuevo) | Esperado |
|---|---|---|---|---|
| GET | `/liquidaciones` | Token | — | 200 `array[10]` |
| GET | `/liquidaciones/1` | Token | — | 200 |
| POST | `/liquidaciones` | Token REPARTIDOR/ADMIN | `{ "turno_id":1, "repartidor_id":4, "monto_entregado_repartidor":500, "monto_recaudado_efectivo":300, "monto_recaudado_voucher":200 }` | 201 |

### 4.26 REPORTES

| Método | Ruta | Auth | Esperado |
|---|---|---|---|
| GET | `/reportes/utilidad-diaria` | Token ADMIN | 200 `{ fecha, ventas, costos, utilidad }` |
| GET | `/reportes/gastos-operativos` | Token ADMIN | 200 `{ total_gastos, detalle }` |
| GET | `/reportes/anulaciones` | Token ADMIN | 200 `{ total_anulaciones, detalle }` |
| GET | `/reportes/auditoria/movimientos` | Token ADMIN | 200 (movimientos/inventario) |
| GET | `/reportes/repartidores/disponibles` | Token ADMIN/DESPACHADOR | 200 |

> Rutas correctas: **`/reportes/auditoria/movimientos`** y **`/reportes/repartidores/disponibles`**
> (no `/reportes/auditoria` ni `/reportes/repartidores` sueltos).

---

## 5. Pagos Stripe

El módulo `/pagos` está habilitado con `STRIPE_SECRET_KEY` (modo **test**). Los montos son en
**GTQ** (centavos). Los pagos aparecen en el dashboard de Stripe en modo Test.

### 5.1 Checkout (página de Stripe)

```
POST /pagos/checkout    (público)
Content-Type: application/json

{
  "items": [
    { "nombre": "Big Mac", "cantidad": 2, "monto": 48.00 },
    { "nombre": "Papas Medianas", "cantidad": 1, "monto": 22.00 }
  ]
}
```

Respuesta 201: `{ data: { id: "cs_...", url: "https://checkout.stripe.com/..." }, error: null }`.
Abrir `url` en el navegador y pagar con tarjeta de prueba:

- `4242 4242 4242 4242` — cualquier CVC, fecha futura
- `4000 0000 0000 0002` — tarjeta que se **rechaza** (declinada)

### 5.2 PaymentIntent (backend maneja la tarjeta)

Ideado para que el backend procese el pago directamente (sin redirigir).

```
POST /pagos/payment-intent    (público)
Content-Type: application/json

{
  "items": [
    { "nombre": "Big Mac", "cantidad": 2, "monto": 48.00 }
  ],
  "tarjeta": {
    "number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2028,
    "cvc": "123"
  },
  "pedido_id": 1
}
```

Respuesta 201: `{ data: { id: "pi_...", status: "succeeded" }, error: null }`.

> **Importante:** Stripe bloquea el envío de datos crudos de tarjeta desde el backend.
> El código mapea automáticamente los números de prueba a **tokens de prueba** de Stripe
> (`tok_visa`, `tok_mastercard`, etc.), así que el payment funciona igual.

Tarjetas de prueba soportadas (columna izquierda — número recibido → token usado):

| Número | Marca |
|---|---|
| `4242424242424242` | Visa |
| `5555555555554444` / `5105105105105100` | Mastercard |
| `4000056655665556` | Visa Débito |
| `4000002760003182` | Visa Crédito |
| `5200828282828210` | Mastercard Débito |
| `2223003122003222` | Mastercard Crédito |
| `378282246310005` | Amex |
| `6011111111111117` | Discover |
| `30569309025904` | Diners |
| `6200000000000005` | UnionPay |

Si el número no está en la lista → 400 `Tarjeta no reconocida para pruebas...`.

Variantes del payload:

- Con `payment_method` (creado con Stripe Elements): `{ "items":[...], "payment_method":"pm_...", "pedido_id":1 }`.
  Si el `pm_...` no existe, el backend lo ignora y cae a `tarjeta`.
- Solo con `pedido_id` y tarjeta de prueba: `fake pedido 1` queda en la metadata del PI.

### 5.3 Consultar un pago

```
GET /pagos/pi_XXXX     (público)
```

Respuesta 200: `{ data: { id, status, amount, currency, created, pedido_id }, error: null }`.
Con un id inexistente → 404 `PaymentIntent no encontrado`.

> Verificación en Stripe: Dashboard → Payments (modo Test). Ejemplo real ya cobrado:
> `pi_3UGxeADIrNO9WSca0Zk83TEW` (status `succeeded`).
>
> **Pendiente del usuario (no implementado):** persistir el pago en BD / webhook de Stripe.

---

## 6. Casos negativos transversales (resumen)

| Código | Disparo | Ejemplo |
|---|---|---|
| 400 | Validación Zod (campos faltantes, tipos, refine, strict) | `POST /clientes` con `{nombre:"J"}` o `{telefono:"abc12345"}`; `PATCH /productos/1` con `campoExtra` |
| 401 | Sin token / token inválido | `GET /clientes` sin header `Authorization` → `Token no proporcionado` |
| 403 | Rol no permitido (prueba con usuario no-ADMIN) | `GET /reportes/utilidad-diaria` con token de CAJERO |
| 404 | ID inexistente (`99999`) | `GET /clientes/99999`, `POST` con FK inexistente |
| 429 | > 100 requests / 15 min por IP | Cualquier endpoint → `Demasiadas request, Por favor intenta más tarde.` |

Enums inválidos que deben dar 400:

| Campo | Válidos | Inválido de prueba |
|---|---|---|
| `pedido.estado` | CREADO, LISTO, ANULADO, EN_RUTA, ENTREGADO | `PENDIENTE` |
| `ordenCompra.estado` | CREADA, EN_PROCESO, FINALIZADO, ANULADO | `ENVIADO` |
| `ordenTrabajo.estado` | GENERADA, EN_PROCESO, ANULADA, FINALIZADA | `COMPLETADO` |
| `caja.tipo` | CAJA_CHICA, GASTOS_REPRESENTACION, TRANSITO | `NORMAL` |
| `usuario.rol` | ADMIN, BODEGUERO, DESPACHADOR, REPARTIDOR, CAJERO | `SUPERVISOR` |
| `hojaRecepcion.tipo_recepcion` | TOTAL, PARCIAL | `INVALIDO` |
| `turno` montos | ≥ 0 / positivos | negativos o strings |

Tipos incorrectos (todos deben dar 400):

- `categoria_id: "abc"` / `"123"` / `true` / `null` → `Expected number, received ...`
- `precio: "25.50"` → `Expected number, received string` (Zod no parsea strings)
- `es_perecedera: "si"` / `1` → `Expected boolean, received ...`

### 6.1 Strict mode (PATCH con propiedad extra → 400)

Schemas con `.strict()`: `schemaProductoUpdate`, `schemaBodegaUpdate`, `schemaAlacenaUpdate`,
`schemaCajaUpdate`, `schemaDireccionUpdate`, `schemaRecetaUpdate`.

Prueba: `PATCH /productos/1` `{ "precio": 30, "campoExtra": "x" }`
→ 400 `Unrecognized key(s) in object: 'campoExtra'`.

### 6.2 CORS y seguridad

- Orígenes permitidos: `http://localhost:5173`, `http://localhost:5174`,
  `http://127.0.0.1:5500`, `http://localhost:3000`, `http://127.0.0.1:3000`.
- Header `X-Powered-By` debe **no existir** (verificar con `curl -I http://localhost:3000/`).
- `X-Content-Type-Options: nosniff` presente (helmet).

---

## 7. Postman / JSON de prueba existentes

La carpeta `pruebas/` ya contiene **175 casos** con bodies y esperados por módulo:

| Archivo | Contenido | Pruebas |
|---|---|---|
| `00_POSTMAN_COLLECTION.json` | Collection base (login + token) | 4 |
| `01_USUARIOS.json` | CRUD usuarios | 15 |
| `02_CLIENTES.json` | CRUD clientes + validaciones teléfono | 14 |
| `03_PRODUCTOS.json` | CRUD productos + strict/stock | 22 |
| `04_CATEGORIAS.json` | CRUD categorías | 9 |
| `05_PROVEEDORES.json` | CRUD proveedores + regex NIT | 10 |
| `06_PEDIDOS.json` | Pedidos con items | 13 |
| `07_CATALOGOS.json` | Sucursales, bodegas, alacenas, cajas, unidades, materias primas | 30 |
| `08_RECETAS_Y_ORDENES.json` | Recetas, órdenes trabajo y compra | 18 |
| `09_FACTURAS_Y_DESPACHO.json` | Direcciones, facturas, hojas, gastos, liquidaciones | 20 |
| `10_CASOS_ESPECIALES.json` | Fechas, enums, strict, rate limit, CORS | 20 |

Flujo en Postman:

1. Importar `pruebas/00_POSTMAN_COLLECTION.json`.
2. Ejecutar `POST /auth/login` (admin.mc / umg123), copiar `token`.
3. Asignar el token a la variable de collection `{{token}}`.
4. Ejecutar los casos de cada archivo validando status + body (`{ data, error }`).

---

## 8. Checklist rápido end-to-end (todo el sistema)

Para una prueba "humo" de todo el flujo en orden:

1. `POST /auth/login` → token ✔
2. `GET /sucursales`, `/productos`, `/clientes`, `/categorias` (catálogos) ✔
3. `POST /clientes` y `POST /productos` (create con data nueva) ✔
4. `POST /pedidos` → `PATCH /pedidos/:id/confirmar` → `PATCH /pedidos/:id/entregado` ✔
5. `POST /recetas` → `POST /ordenes-trabajo` → `iniciar` → `terminar` ✔
6. `POST /ordenes-compra` → `agendar` → `PATCH /:id/estado EN_PROCESO` ✔
7. `POST /hojas-recepcion` (stock materia prima) → `GET /stock-bodega` ✔
8. Abrir **caja**: `POST /turnos/apertura` → cobrar con `POST /facturas-venta` → `cierre` → `validar` ✔
9. `POST /liquidaciones` (repartidor) después de `entregado` ✔
10. Reportes: `/reportes/utilidad-diaria`, `/reportes/gastos-operativos` ✔
11. Pagos: `POST /pagos/checkout` (pagar en página Stripe) y `POST /pagos/payment-intent` (tarjeta `4242424242424242`) → verificar `pi_...` en Dashboard ✔