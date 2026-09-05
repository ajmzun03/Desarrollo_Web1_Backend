# COPAC — Plan de métodos y Zod por tabla

Basado únicamente en el schema oficial (`db.ts`). Donde el ERD todavía no tiene una columna que necesitas, se marca como ⚠️ en vez de asumirla.

Cómo usarlo: ve tabla por tabla, marca el checkbox cuando tengas el endpoint + su schema Zod (`insertXSchema` / `selectXSchema` / `updateXSchema`) implementados y probados.

---

## Decisiones ya tomadas

- **`stock_minimo`**: es **global** (no por sucursal). Va como columna nueva en `PRODUCTO` — actualmente no existe en el schema, hay que agregarla antes de construir `PATCH /productos/:id/stock-minimo`.

## Pendientes a decidir antes de seguir (detectados en el propio `db.ts`)

- [ ] `rolUsuarioEnum` solo tiene 5 valores (`ADMIN, BODEGUERO, DESPACHADOR, REPARTIDOR, CAJERO`). Si necesitas distinguir ventas/cocina/compras/gerencia como roles propios en middleware, hay que ampliar el enum.
- [ ] `PEDIDO` no tiene `sucursal_id` ni `forma_pago`. Si tu flujo de negocio los necesita en el body de creación, hay que agregar esas columnas al schema primero.
- [ ] `GASTOS_SUCURSAL` reutiliza las mismas columnas de apertura/cierre de caja que `TURNO_DESPACHADOR` (`monto_apertura`, `monto_cierre_declarado`, `monto_cierre_sistema`, `abierto_en`, `cerrado_en`). Revisa si es intencional o copy/paste — conceptualmente un gasto no debería tener "apertura/cierre".
- [ ] `SUCURSAL` y `PROVEEDOR` no tienen columna de estado activo/inactivo — si quieres soft-delete/desactivar, hay que agregarla.
- [ ] `MUNICIPIO` tiene `id` como primary key normal (no identity) → se llena por seed/migración, no por endpoint. Confirmar que así se quiere mantener.

---

## A. Catálogos base

### `SUCURSAL` ANGEL
- **FKs:** `municipio_id → MUNICIPIO`
- [ ok ] `GET /sucursales`
- [ ok ] `GET /sucursales/:id`
- [ ok ] `POST /sucursales`
- [ ok ] `PATCH /sucursales/:id`
- **Zod:** `insertSucursalSchema` (omit `id`), `selectSucursalSchema`, `updateSucursalSchema = insert.partial()`
- **Nota:** sin columna de estado — ver pendiente arriba.

### `MUNICIPIO` ANGEL
- **FKs:** `departamento_id → DEPARTAMENTO`
- [ ok ] `GET /municipios`
- **Zod:** solo `selectMunicipioSchema` (dato semilla, sin insert/update expuesto)

### `DEPARTAMENTO` ANGEL
- [ ok ] `GET /departamentos`
- [ ok ] `POST /departamentos` *(opcional — decide si lo administras desde la app o solo por seed)*
*Consulta* - `Se agrega el método PATCH?? Para actualizar el depto? Considero que no media vez se ingresó/creó ´
- **Zod:** `selectDepartamentoSchema`; `insertDepartamentoSchema` solo si decides exponer POST

### `CATEGORIA` ANGEL
- [ ok ] `GET /categorias`
- [ ok ] `POST /categorias`
- [ ok ]  `PATCH /categorias/:id`
- **Zod:** insert/select/update completos

### `UNIDAD_MEDIDA` ANGEL
- [ ok ] `GET /unidades-medida`
- [ ok ] `POST /unidades-medida`
- [ ok ] `PATCH /unidades-medida/:id`
- **Zod:** insert/select/update completos

### `USUARIO` ANGEL
- **FKs:** ninguna
- [ ok ] `GET /usuarios` *(solo ADMIN)*
- [ ok ] `POST /usuarios`
- [ ok ] `PATCH /usuarios/:id` *(incluye reasignar `rol`)*
- **Zod:** `rol: z.enum(['ADMIN','BODEGUERO','DESPACHADOR','REPARTIDOR','CAJERO'])`; validar `correo_electronico` y `contrasenia` como texto plano de entrada (el hash sha256 va después, a nivel app, no en el Zod de entrada)
- **Nota:** ver pendiente de roles arriba.

---

## B. Clientes y direcciones

### `CLIENTE` ANGEL
- [ ok ] `GET /clientes?telefono=` *(buscar antes de crear, evita duplicados)*
- [ ok ] `POST /clientes` *(valida `telefono` y `telefono_ref` únicos)*
- [ ok ] `PATCH /clientes/:id`
- **Zod:** insert/select/update; regex o `z.string().min()` para teléfonos

### `DIRECCION` ANGEL
- **FKs:** `cliente_id → CLIENTE`, `municipio_id → MUNICIPIO`
- [ ok  ] `GET /direcciones?cliente_id=`
- [ ok ] `POST /direcciones`
- [ ok ] `PATCH /direcciones/:id`
- **Zod:** insert/select/update

---

## C. Materia prima e inventario (bodega / alacena)

### `MATERIA_PRIMA` ANGEL
- **FKs:** `categoria_id`, `unidad_medida_id`
- [ ok ] `GET /materias-primas`
- [ ok ] `POST /materias-primas`
- [ ok ] `PATCH /materias-primas/:id`
- **Zod:** insert/select/update
- **Nota:** ⚠️ si el `stock_minimo` global también debe aplicar a insumos (no solo a `PRODUCTO`), agrégalo aquí también.

### `LOTE_MATERIA_PRIMA` ANGEL
- **FKs:** `materia_prima_id`
- [ ] `GET /lotes?materia_prima_id=&bodega_id=&fefo=true` *(orden por `fecha_vencimiento`)*
- **Sin POST/PATCH directo** — se crea/actualiza dentro de la transacción de `HOJA_RECEPCION`.
- **Zod:** solo `selectLoteSchema` para el cliente; `insertLoteSchema` se usa internamente en el service de recepción.

### `BODEGA` ANGEL
- **FKs:** `sucursal_id`
- [ ] `GET /bodegas`
- [ ] `POST /bodegas`
- [ ] `PATCH /bodegas/:id`
- **Zod:** insert/select/update

### `STOCK_BODEGA` ANGEL
- **FKs:** `bodega_id`, `lote_id`
- [ ] `GET /stock-bodega?bodega_id=`
- **Nunca POST/PATCH directo** — se actualiza dentro de `recepcion.service`, `traslado.service`, `despacho.service`.
- **Zod:** solo `selectStockBodegaSchema`

### `KARDEX_BODEGA` ANGEL
- **FKs:** `bodega_id`, `lote_id`
- [ ] `GET /kardex-bodega?bodega_id=&lote_id=&tipo_movimiento=`
- **Nunca POST directo** — el service inserta el movimiento como parte de otra transacción (recepción, traslado, despacho, cuadre).
- **Zod:** solo `selectKardexBodegaSchema` (para reportes/auditoría)

### `ALACENA` ANGEL
- **FKs:** `bodega_id`
- [ ] `GET /alacenas`
- [ ] `POST /alacenas`
- [ ] `PATCH /alacenas/:id`
- **Zod:** insert/select/update

### `STOCK_ALACENA` ADRIANJUAN
- **FKs:** `alacena_id`, `lote_id`
- [ ] `GET /stock-alacena?alacena_id=`
- **Nunca POST/PATCH directo** — igual que `STOCK_BODEGA`.
- **Zod:** solo `selectStockAlacenaSchema`

### `KARDEX_ALACENA` ANGEL
- **FKs:** `alacena_id`, `lote_id`
- [ ] `GET /kardex-alacena?alacena_id=&lote_id=`
- **Nunca POST genérico** — un movimiento tipo `MER` (merma) se inserta desde un endpoint de negocio específico, no desde un CRUD abierto de esta tabla.
- **Zod:** solo `selectKardexAlacenaSchema`

---

## D. Productos y ventas

### `PRODUCTO` ADRIANJUAN
- **FKs:** `categoria_id`, `unidad_medida_id`
- [ ] `GET /productos`
- [ ] `POST /productos`
- [ ] `PATCH /productos/:id`
- **Zod:** insert/select/update; `precio: z.number().positive()`
- **Nota:** ⚠️ agregar columna `stock_minimo` (global) antes de construir `PATCH /productos/:id/stock-minimo`.

### `PEDIDO` ADRIANJUAN
- **FKs:** `cliente_id`
- [ ] `GET /pedidos?cliente_id=&estado=`
- [ ] `GET /pedidos/:id` *(con `DETALLE_PEDIDO`)*
- [ ] `POST /pedidos` — crea `PEDIDO` + `DETALLE_PEDIDO` en una transacción. Body real según schema: `{ cliente_id, observaciones?, items:[{producto_id, cantidad}] }`
- [ ] `PATCH /pedidos/:id/estado` — `estadoPedidoEnum`: `CREADO → LST → ENR → ENT`, o `ANL`
- **Zod:** `estado: z.enum(['CREADO','LST','ANL','ENR','ENT'])`
- **Nota:** ⚠️ sin `sucursal_id` ni `forma_pago` en el schema — no los asumas hasta agregarlos.

### `DETALLE_PEDIDO` ADRIANJUAN
- **Sin endpoint propio** — siempre dentro de `POST /pedidos` (insert) y `GET /pedidos/:id` (select vía join).
- **Zod:** `insertDetallePedidoSchema.omit({ id: true, pedido_id: true })` para usar dentro del schema compuesto.

### `FACTURA_VENTA` ADRIANJUAN
- **FKs:** `pedido_id`
- [ ] `POST /facturas-venta`
- [ ] `GET /facturas-venta?pedido_id=`
- **Zod:** insert/select; `total: z.number().positive()`

---

## E. Compras y proveedores

### `PROVEEDOR` ADRIANJUAN
- [ ] `GET /proveedores`
- [ ] `POST /proveedores`
- [ ] `PATCH /proveedores/:id`
- **Zod:** insert/select/update
- **Nota:** sin columna de estado — ver pendiente arriba.

### `ORDEN_COMPRA` 
- **FKs:** `proveedor_id`, `sucursal_destino`
- [ ] `POST /ordenes-compra` — con `DETALLE_ORDEN_COMPRA`, en una transacción
- [ ] `GET /ordenes-compra?estado=&proveedor_id=`
- [ ] `GET /ordenes-compra/:id`
- [ ] `PATCH /ordenes-compra/:id/estado` — `estadoOrdenCompraEnum`: `CRD → ENP → FNL`, o `ANL`
- **Zod:** `estado_orden: z.enum(['CRD','ENP','FNL','ANL'])`

### `DETALLE_ORDEN_COMPRA`
- **Sin endpoint propio** — siempre dentro de `POST /ordenes-compra`.
- **Zod:** `insertDetalleOrdenCompraSchema.omit({ id: true, orden_compra_id: true })`

### `HOJA_RECEPCION`
- **FKs:** `sucursal_receptora`, `orden_compra_id`
- [ ] `POST /hojas-recepcion` — **endpoint clave**: `HOJA_RECEPCION` + `HOJA_RECEPCION_DETALLE` + `LOTE_MATERIA_PRIMA` + movimiento en `KARDEX_BODEGA`, todo en una transacción
- [ ] `GET /hojas-recepcion/:id`
- [ ] `GET /hojas-recepcion?orden_compra_id=`
- **Zod:** `tipo_recepcion: z.enum(['Total','Parcial'])`

### `HOJA_RECEPCION_DETALLE`
- **Sin endpoint propio** — dentro de `POST /hojas-recepcion`.
- **Zod:** incluye `estado: z.enum(['Completa','Incompleta'])` por línea

### `FACTURA_COMPRA`
- **FKs:** `hoja_recepcion_id`
- [ ] `POST /facturas-compra`
- [ ] `GET /facturas-compra?hoja_recepcion_id=`
- **Zod:** insert/select; `total: z.number().positive()`

---

## F. Producción / cocina

### `RECETA`
- **FKs:** `producto_id`
- [ ] `GET /recetas`
- [ ] `GET /recetas/:id` *(con `RECETA_DETALLE`)*
- [ ] `POST /recetas` — con insumos, en transacción
- [ ] `PATCH /recetas/:id`
- **Zod:** insert/select/update; `cantidad_lote: z.number().positive()`

### `RECETA_DETALLE`
- **Sin endpoint propio** — dentro de `POST`/`PATCH /recetas`.
- **Zod:** `insertRecetaDetalleSchema.omit({ id: true, receta_id: true })`

### `ORDEN_TRABAJO`
- **FKs:** `sucursal_id`, `receta_id`
- [ ] `GET /ordenes-trabajo?sucursal_id=&estado=`
- [ ] `POST /ordenes-trabajo` — genera la orden (valida disponibilidad de insumos según receta)
- [ ] `PATCH /ordenes-trabajo/:id/estado` — `estadoOrdenTrabajoEnum` exacto: `GENERADA → EN PROCESO → FINALIZADA`, o `ANULADA`
- **Zod:** `estado: z.enum(['GENERADA','EN PROCESO','ANULADA','FINALIZADA'])`

### `PRODUCTO_LOTE`
- **FKs:** `orden_id`
- [ ] `GET /producto-lote?orden_id=&estado=`
- **Sin POST directo** — se crea dentro de `PATCH /ordenes-trabajo/:id/estado` cuando pasa a `FINALIZADA`.
- **Zod:** solo `selectProductoLoteSchema` para el cliente

---

## G. Despacho / logística

### `HOJA_DESPACHO`
- **FKs:** `pedido_id`, `sucursal_despacho`
- [ ] `POST /hojas-despacho` — con detalle, en transacción (descarga `PRODUCTO_LOTE` y mueve kardex)
- [ ] `GET /hojas-despacho/:id`
- [ ] `GET /hojas-despacho?pedido_id=`
- **Zod:** insert compuesto

### `HOJA_DESPACHO_DETALLE`
- **Sin endpoint propio** — dentro de `POST /hojas-despacho`.
- **Zod:** `insertHojaDespachoDetalleSchema.omit({ id: true, hoja_despacho_id: true })`

---

## H. Caja y finanzas

### `CAJA`
- **FKs:** `sucursal_id`
- [ ] `GET /cajas`
- [ ] `POST /cajas`
- [ ] `PATCH /cajas/:id`
- **Zod:** `tipo: z.enum(['Caja chica','GastosR','Transito'])`

### `TURNO_DESPACHADOR`
- **FKs:** `caja_id`, `usuario_id`, `administrador_id`
- [ ] `POST /turnos/apertura`
- [ ] `PATCH /turnos/:id/cierre` — compara `monto_cierre_declarado` vs `monto_cierre_sistema`
- [ ] `GET /turnos?caja_id=&usuario_id=`
- **Zod:** montos con `z.number().min(0)`

### `LIQUIDACION_REPARTIDOR`
- **FKs:** `turno_id`, `repartidor_id`
- [ ] `POST /liquidaciones`
- [ ] `GET /liquidaciones?turno_id=`
- **Zod:** montos con `z.number().min(0)`

### `GASTOS_SUCURSAL`
- **FKs:** `caja_id`, `usuario_id`, `sucursal_id`
- [ ] `POST /gastos-sucursal`
- [ ] `GET /gastos-sucursal?sucursal_id=&caja_id=`
- **Zod:** montos con `z.number().min(0)`
- **Nota:** ⚠️ revisar duplicidad de columnas de apertura/cierre con `TURNO_DESPACHADOR` (ver pendientes arriba) antes de tipar el Zod definitivo.

---

## Progreso general

- [ ] A. Catálogos base (5 tablas)
- [ ] B. Clientes y direcciones (2 tablas)
- [ ] C. Materia prima e inventario (8 tablas)
- [ ] D. Productos y ventas (4 tablas)
- [ ] E. Compras y proveedores (6 tablas)
- [ ] F. Producción / cocina (4 tablas)
- [ ] G. Despacho / logística (2 tablas)
- [ ] H. Caja y finanzas (4 tablas)
