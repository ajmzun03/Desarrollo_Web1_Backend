# COPAC — Listado de Endpoints API

Backend: Express + Drizzle ORM + Supabase/PostgreSQL. Organizado por **módulo/rol**, no por tabla — las tablas de detalle van dentro de la transacción de su tabla padre, y las tablas de kardex/stock **nunca** se exponen para escritura directa.

**Convención de respuesta:** todas las rutas devuelven `{ data, error }`. Rutas protegidas requieren `Authorization: Bearer <token>` (Supabase Auth) + verificación de `rol` en middleware.

---

## 0. Auth (transversal)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Login vía Supabase Auth, retorna sesión + rol del usuario |
| POST | `/auth/logout` | Cierra sesión |
| GET | `/auth/me` | Usuario autenticado + rol + sucursal asignada |

---

## 1. Catálogos (Admin / setup — usado por varios roles en modo lectura)

CRUD simple. `DELETE` real solo donde aplique; en el resto usar `PATCH /:id/estado`.

| Método | Ruta | Tabla(s) | Notas |
|---|---|---|---|
| GET / POST | `/sucursales` | `SUCURSAL` | |
| GET / PATCH | `/sucursales/:id` | `SUCURSAL` | |
| GET | `/municipios`, `/departamentos` | `MUNICIPIO`, `DEPARTAMENTO` | Solo lectura, dato semilla |
| GET / POST / PATCH | `/direcciones` | `DIRECCION` | Usada por clientes y sucursales |
| GET / POST / PATCH | `/categorias` | `CATEGORIA` | Categoría de producto/materia prima |
| GET / POST / PATCH | `/unidades-medida` | `UNIDAD_MEDIDA` | |
| GET / POST / PATCH | `/bodegas` | `BODEGA` | |
| GET / POST / PATCH | `/alacenas` | `ALACENA` | |
| GET / POST / PATCH | `/proveedores` | `PROVEEDOR` | `PATCH /:id/estado` para activar/desactivar (RF Encargado de Compras) |
| GET / POST / PATCH | `/usuarios` | `USUARIO` | Solo Admin/Gerente General; incluye asignación de `rol` |
| GET / POST / PATCH | `/materias-primas` | `MATERIA_PRIMA` | |
| GET / POST / PATCH | `/productos` | `PRODUCTO` | Ficha de producto (RF Encargado de Compras) |
| GET / POST / PATCH | `/recetas` | `RECETA` + `RECETA_DETALLE` | Body incluye array de insumos; se guarda en una transacción |
| GET | `/recetas/:id` | `RECETA` + `RECETA_DETALLE` | Detalle con insumos y cantidades necesarias |

---

## 2. Ventas — Agente de Ventas (RF-001 a RF-004)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/clientes?telefono=` | `CLIENTE` | Buscar cliente antes de registrar (evita duplicados) |
| POST | `/clientes` | `CLIENTE` | Registro de cliente (RF-001) — valida teléfono único |
| PATCH | `/clientes/:id` | `CLIENTE` | Editar datos de cliente |
| GET | `/productos/disponibilidad?sucursal_id=` | `PRODUCTO` + `STOCK_ALACENA` | Catálogo con disponibilidad en tiempo real (RF-002) |
| POST | `/pedidos` | `PEDIDO` + `DETALLE_PEDIDO` | Crea pedido con sus líneas en una sola transacción (RF-003/004). Body: `{ cliente_id, sucursal_id, forma_pago, items:[{producto_id, cantidad}] }` |
| GET | `/pedidos/:id` | `PEDIDO` + `DETALLE_PEDIDO` | Detalle de un pedido |
| PATCH | `/pedidos/:id/confirmar` | `PEDIDO` | Cambia estado a "enviado a cocina" → dispara `ORDEN_TRABAJO` si aplica |

---

## 3. Cocina — Jefe de Cocina (RF-001 a RF-006)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/ordenes-trabajo?sucursal_id=&estado=` | `ORDEN_TRABAJO` | Tablero de órdenes (kanban) |
| POST | `/ordenes-trabajo` | `ORDEN_TRABAJO` + `PRODUCTO_LOTE` | Genera orden de trabajo a partir de receta (RF-001) |
| PATCH | `/ordenes-trabajo/:id/estado` | `ORDEN_TRABAJO` | Pendiente → En preparación → Terminado |
| GET | `/materias-primas/criticas?sucursal_id=` | `MATERIA_PRIMA` + `LOTE_MATERIA_PRIMA` | Insumos bajo umbral o próximos a vencer (RF-002) |
| POST | `/solicitudes-insumos` | *(nueva tabla sugerida, ver nota)* | Solicitud de insumos a bodega (RF-003) — ver nota abajo |
| GET | `/productos/stock?sucursal_id=` | `PRODUCTO_LOTE` | Control de stock de producto terminado (RF-004) |
| GET | `/alacena/vencimientos?alacena_id=` | `KARDEX_ALACENA` + `STOCK_ALACENA` | Monitoreo de vencimientos en alacena (RF-005) |
| POST | `/alacena/mermas` | `KARDEX_ALACENA` (tipo_movimiento=merma) | Reporta merma/vencido — mueve kardex, nunca se inserta directo (RF-006) |

> ⚠️ No veo una tabla `SOLICITUD_INSUMO` en tu ERD — la necesitas para el RF-003 (Jefe de Cocina pide insumos a Bodega). Te recomiendo agregarla (`id, sucursal_id, solicitado_por, estado, items[]`) antes de construir ese endpoint.

---

## 4. Cocinero (RF-001 a RF-002 — tablet/kiosco)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/ordenes-trabajo/cola?sucursal_id=` | `ORDEN_TRABAJO` | Cola en tiempo real (considera Supabase Realtime en vez de polling) |
| GET | `/ordenes-trabajo/:id/receta` | `RECETA_DETALLE` + `MATERIA_PRIMA` | Insumos necesarios para esa orden |
| PATCH | `/ordenes-trabajo/:id/iniciar` | `ORDEN_TRABAJO` | Marca inicio de preparación |
| PATCH | `/ordenes-trabajo/:id/terminar` | `ORDEN_TRABAJO` + `PRODUCTO_LOTE` + `KARDEX_ALACENA` | Cierra orden y da entrada al producto terminado (transacción) |

---

## 5. Compras — Encargado de Compras (RF-001 a RF-007)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET / POST | `/proveedores` | `PROVEEDOR` | (ver también sección Catálogos) |
| POST | `/ordenes-compra` | `ORDEN_COMPRA` + `DETALLE_ORDEN_COMPRA` | Emisión de OC (RF-004) — transacción única con las líneas |
| GET | `/ordenes-compra?estado=&sucursal_id=` | `ORDEN_COMPRA` | Listado de OC vigentes (RF-007) |
| GET | `/ordenes-compra/:id` | `ORDEN_COMPRA` + `DETALLE_ORDEN_COMPRA` | Detalle |
| PATCH | `/ordenes-compra/:id/agendar` | `ORDEN_COMPRA` | Agendamiento de entrega (RF-005) |
| PATCH | `/ordenes-compra/:id/estado` | `ORDEN_COMPRA` | Cambios de estado manual (cancelar, etc.) |
| POST | `/facturas-compra` | `FACTURA_COMPRA` | Ingreso de factura vinculada a OC + recepción (RF-006). Body: `{ hoja_recepcion_id, serie, numero, total, ... }` |
| GET | `/facturas-compra?orden_compra_id=` | `FACTURA_COMPRA` | Consulta |

---

## 6. Bodega — Bodeguero (RF-001 a RF-010)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/ordenes-compra/programadas?bodega_id=` | `ORDEN_COMPRA` | OC agendadas por recibir (RF-001) |
| POST | `/hojas-recepcion` | `HOJA_RECEPCION` + `HOJA_RECEPCION_DETALLE` + `LOTE_MATERIA_PRIMA` + `KARDEX_BODEGA` | **Endpoint clave**: registra recepción con báscula, calcula merma, crea lote y mueve kardex — todo en una transacción (RF-002/003/004) |
| GET | `/hojas-recepcion/:id` | `HOJA_RECEPCION` + `HOJA_RECEPCION_DETALLE` | Detalle |
| GET | `/lotes/fefo?bodega_id=&materia_prima_id=` | `LOTE_MATERIA_PRIMA` | Lotes ordenados por vencimiento próximo (RF-005) |
| POST | `/traslados` | `KARDEX_BODEGA` (origen/destino) | Traslado de insumos entre sucursales (RF-006) — dos movimientos de kardex en una transacción |
| POST | `/bodega/ingreso-vale` | `KARDEX_BODEGA` + `GASTOS_SUCURSAL` | Ingreso de producto por vale de gasto administrativo (RF-007) |
| POST | `/hojas-despacho` | `HOJA_DESPACHO` + `HOJA_DESPACHO_DETALLE` + `KARDEX_ALACENA`/`KARDEX_BODEGA` | Descarga de inventario por traslado interno a cocina (RF-008) |
| POST | `/inventario/cuadre` | `STOCK_BODEGA` (lectura) + `KARDEX_BODEGA` (ajuste) | Cuadre diario: compara sistema vs físico y registra ajuste/merma (RF-009) |
| GET | `/inventario/bajo-minimo?sucursal_id=` | `STOCK_BODEGA` + `PRODUCTO`/`MATERIA_PRIMA` | Reporte de existencia bajo el mínimo (RF-010) |

---

## 7. Despacho — Despachador (RF-001 a RF-004)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| POST | `/turnos/apertura` | `TURNO_DESPACHADOR` | Apertura de turno con sencillo inicial (RF-002) |
| GET | `/pedidos/listos?sucursal_id=` | `PEDIDO` | Pedidos listos para despacho (RF-001) |
| GET | `/repartidores/disponibles?sucursal_id=` | `USUARIO` (rol=repartidor) | Repartidores libres/en ruta |
| POST | `/hojas-despacho` | `HOJA_DESPACHO` + `HOJA_DESPACHO_DETALLE` | Asigna repartidor y saca pedido a ruta (RF-003) |
| PATCH | `/turnos/:id/cierre` | `TURNO_DESPACHADOR` | Arqueo de caja y cierre de turno (RF-004) — compara `monto_cierre_declarado` vs `monto_cierre_sistema` |

---

## 8. Repartidor (RF-001 a RF-003 — app móvil)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/repartidor/pedidos?repartidor_id=` | `HOJA_DESPACHO` + `PEDIDO` | Pedidos asignados en ruta |
| PATCH | `/pedidos/:id/entregado` | `PEDIDO` | Confirmar entrega (RF-001) |
| POST | `/pedidos/:id/incidente` | `PEDIDO` (o tabla `INCIDENTE` si se agrega) | Reporte de incidente/devolución (RF-002) |
| POST | `/liquidaciones` | `LIQUIDACION_REPARTIDOR` | Cierre de ruta y liquidación de valores al despachador (RF-003) |

---

## 9. Administración — Gerente de Sucursal (RF-001 a RF-005)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| POST | `/gastos-sucursal` | `GASTOS_SUCURSAL` | Registro de gasto + emisión de vale (RF-001) |
| POST | `/turnos/:id/sencillo` | `TURNO_DESPACHADOR` | Asignación de efectivo inicial a despachador (RF-002) |
| GET | `/turnos/pendientes-validacion?sucursal_id=` | `TURNO_DESPACHADOR` | Cortes de turno por validar |
| PATCH | `/turnos/:id/validar` | `TURNO_DESPACHADOR` | Aprueba o marca diferencia (RF-003) |
| GET | `/reportes/utilidad-diaria?sucursal_id=&fecha=` | `PEDIDO`, `GASTOS_SUCURSAL` (agregación) | Utilidad neta diaria (RF-004) — vista/consulta agregada, sin tabla propia |
| PATCH | `/productos/:id/stock-minimo` | `PRODUCTO` (o config aparte) | Definición de stock mínimo y alertas (RF-005) |

---

## 10. Gerencia — Gerente General (RF-001 a RF-003)

| Método | Ruta | Tabla(s) | Descripción |
|---|---|---|---|
| GET | `/reportes/gastos-operativos?desde=&hasta=&sucursal_id=` | `GASTOS_SUCURSAL` (agregación multi-sucursal) | Resumen de gastos operativos (RF-001) |
| GET | `/auditoria/movimientos?tipo=&sucursal_id=&desde=&hasta=` | `KARDEX_BODEGA` + `KARDEX_ALACENA` + `FACTURA_COMPRA` + `FACTURA_VENTA` | Auditoría de inventario y facturas (RF-002). Solo lectura |
| GET | `/reportes/anulaciones?desde=&hasta=&sucursal_id=` | `PEDIDO` (estado=anulado) | Reporte de anulaciones (RF-003) |

---

## Reglas de diseño aplicadas

1. **Tabla padre + detalle = 1 endpoint, 1 transacción.** `PEDIDO+DETALLE_PEDIDO`, `ORDEN_COMPRA+DETALLE_ORDEN_COMPRA`, `HOJA_RECEPCION+HOJA_RECEPCION_DETALLE`, `HOJA_DESPACHO+HOJA_DESPACHO_DETALLE`, `RECETA+RECETA_DETALLE` nunca se exponen como dos endpoints separados.
2. **Kardex y stock son de solo lectura desde el cliente.** `KARDEX_BODEGA`, `KARDEX_ALACENA`, `STOCK_BODEGA`, `STOCK_ALACENA` se actualizan *dentro* del servicio de negocio (`recepcion.service.ts`, `despacho.service.ts`, `traslado.service.ts`, etc.), nunca vía `POST` directo a esas tablas. Esto evita que alguien "ajuste" inventario sin un movimiento real que lo respalde.
3. **Reportes son `GET` de agregación, no tablas.** Utilidad diaria, auditoría y anulaciones se calculan con queries (vistas SQL o funciones agregadas en Drizzle), no tienen endpoint de escritura.
4. **Estados con `PATCH /:id/accion` en vez de `PATCH /:id` genérico.** Ej. `/turnos/:id/cierre`, `/ordenes-trabajo/:id/terminar` — así cada transición de estado puede tener su propia validación y efectos secundarios (mover kardex, cambiar stock) sin que un `PATCH` genérico permita saltarse el flujo.
5. **Middleware de rol por grupo de rutas.** Ej. todo `/bodega/*` exige rol `bodeguero` o `admin`; combínalo con RLS de Postgres/Supabase como segunda capa.

## Pendiente a definir contigo
- Tabla `SOLICITUD_INSUMO` (Jefe de Cocina → Bodega) no está en el ERD — falta antes de construir ese endpoint.
- Tabla o campo para "incidente de entrega" del Repartidor (RF-002) — actualmente no veo dónde se guardaría el motivo/detalle.
- Confirmar si "stock mínimo" vive en `PRODUCTO`/`MATERIA_PRIMA` o necesita su propia tabla de configuración por sucursal (el mínimo podría variar por sucursal, no ser global al producto).
