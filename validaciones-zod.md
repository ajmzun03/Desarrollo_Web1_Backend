# Recomendaciones de validación Zod por campo

Estas son sugerencias sobre el schema oficial (`db.ts`). Ninguna es obligatoria — decide cuáles aplicar en cada `schemaX.ts`. Donde el campo es FK o generado (`id`, timestamps con `defaultNow()`), normalmente ya no necesitas regla extra porque `createInsertSchema` los omite/hace opcionales solo si tú lo indicas explícitamente con `.omit()`.

---

## 0. Métodos de Zod más allá de `.min()` / `.max()` / `.regex()`

| Método | Para qué sirve |
|---|---|
| `.trim()` | Limpia espacios al inicio/final antes de validar (útil en nombres, direcciones) |
| `.toLowerCase()` | Normaliza texto (ej. correos) |
| `.email()` | Formato de correo |
| `.uuid()` | Si en algún momento migras un id a UUID |
| `.date()` | Fecha `YYYY-MM-DD` (para columnas Drizzle `date`) |
| `.datetime({ offset: true })` | Timestamp ISO completo (para columnas Drizzle `timestamp`) |
| `.length(n)` | Longitud exacta (ej. NIT de Guatemala) |
| `.int()` | Entero — úsalo en todos los FKs e ids numéricos |
| `.positive()` / `.nonnegative()` | `positive()` si el 0 no tiene sentido de negocio (cantidad inicial de un lote); `nonnegative()` si el 0 sí es válido (saldo actual) |
| `.multipleOf(0.01)` | Dinero con 2 decimales exactos |
| `.finite()` | Evita `Infinity`/`NaN` en columnas `doublePrecision` |
| `z.enum([...])` | Debe copiar **exactamente** los valores del `pgEnum` correspondiente |
| `.optional()` | Campo nullable en el schema (sin `.notNull()`) |
| `.refine((val) => ..., 'mensaje')` | Regla que cruza varias condiciones del mismo objeto (ej. `cantidad_actual <= cantidad_inicial`) |
| `.superRefine()` | Cuando necesitas reportar varios errores del mismo objeto a la vez |
| `z.coerce.number()` / `z.coerce.date()` | Si el body llega como string desde un formulario/query param |

Patrón recomendado con `drizzle-zod` para extender una columna puntual sin reescribir todo el schema:

```ts
import { createInsertSchema } from 'drizzle-zod';
import { clienteTable } from '../db';
import { z } from 'zod';

export const insertClienteSchema = createInsertSchema(clienteTable, {
  telefono: (schema) => schema.regex(/^[0-9]{8}$/, 'Debe tener 8 dígitos'),
  nombre: (schema) => schema.trim().min(2).max(100),
});
```

---

## A. Catálogos base

### `SUCURSAL` ANGEL
| Campo | Sugerencia |
|---|---|
| `municipio_id` | `z.number().int().positive()` | OK
| `sucursal` | `z.string().trim().min(2).max(100)` | OK
| `direccion` | `z.string().trim().max(255).optional()` (columna nullable) |

### `MUNICIPIO` ANGEL
| Campo | Sugerencia |
|---|---|
| `departamento_id` | `z.number().int().positive()` | OK
| `municipio` | `z.string().trim().min(2).max(100)` | OK

### `DEPARTAMENTO` ANGEL
| Campo | Sugerencia |
|---|---|
| `departamento` | `z.string().trim().min(2).max(100)` |

### `CATEGORIA` ANGEL
| Campo | Sugerencia |
|---|---|
| `categoria_id` | `z.number().int().positive()` — ojo: es un id "de negocio" distinto al `id` autogenerado; considera si en verdad necesitas los dos |
| `descripcion` | `z.string().trim().min(2).max(100)` | OK

### `UNIDAD_MEDIDA` ANGEL
| Campo | Sugerencia |
|---|---|
| `unidad` | `z.string().trim().min(2).max(50)` | OK
| `abreviatura` | `z.string().trim().min(1).max(4)` | OK

### `USUARIO` 
| Campo | Sugerencia |
|---|---|
| `usuario` | `z.string().trim().min(3).max(50)` | OK
| `correo_electronico` | `z.string().trim().toLowerCase().email().max(255)` — valida el correo en texto plano antes de que la capa de app lo cifre |
| `contrasenia` | `z.string().min(8).max(50)` en el schema de **entrada** (texto plano); no valides el hash con Zod, valida antes de cifrar | 
| `rol` | `z.enum(['ADMIN','BODEGUERO','DESPACHADOR','REPARTIDOR','CAJERO'])` | OK

---

## B. Clientes y direcciones

### `CLIENTE` ANGEL
| Campo | Sugerencia |
|---|---|
| `nombre` | `z.string().trim().min(2).max(100)` | OK
| `apellido` | `z.string().trim().min(2).max(100)` | OK
| `telefono` | `z.string().regex(/^[0-9]{8}$/, 'Teléfono debe tener 8 dígitos')` (ajusta el regex si aceptas formato con guiones o código de país) | OK
| `telefono_ref` | mismo criterio que `telefono`; agrega `.refine` a nivel de objeto para que `telefono !== telefono_ref` si eso es regla de negocio | OK

### `DIRECCION` ANGEL UNIVERSIDAD
| Campo | Sugerencia |
|---|---|
| `cliente_id` | `z.number().int().positive()` |
| `municipio_id` | `z.number().int().positive()` |
| `direccion1` | `z.string().trim().min(5).max(155)` |
| `direccion2` | `z.string().trim().max(100)` — considera si en verdad debe ser obligatorio (la tabla lo tiene `notNull`) |

---

## C. Materia prima e inventario

### `MATERIA_PRIMA` ANGEL
| Campo | Sugerencia |
|---|---|
| `categoria_id` | `z.number().int().positive()` |
| `unidad_medida_id` | `z.number().int().positive()` |
| `materia_prima` | `z.string().trim().min(2).max(150)` |
| `es_perecedera` | `z.boolean()` |
| `maneja_merma` | `z.boolean()` |

### `LOTE_MATERIA_PRIMA` *(schema de solo lectura para el cliente; el insert vive en el service de recepción)* ANGEL
| Campo | Sugerencia (uso interno) |
|---|---|
| `materia_prima_id` | `z.number().int().positive()` |
| `fecha_vencimiento` | `z.string().date()` — no debería ser una fecha pasada al momento del ingreso; considera `.refine(val => new Date(val) > new Date())` |
| `cantidad_inicial` | `z.number().positive().finite()` |
| `cantidad_actual` | `z.number().nonnegative().finite()` — agrega `.refine` a nivel objeto: `cantidad_actual <= cantidad_inicial` |
| `estado` | `z.enum(['Vigente','Vencido','Agotado'])` |

### `BODEGA` ANGEL
| Campo | Sugerencia |
|---|---|
| `sucursal_id` | `z.number().int().positive()` |
| `bodega` | `z.string().trim().min(2).max(100)` |

### `STOCK_BODEGA` *(solo select, no expongas insert/update al cliente)* ANGEL
| Campo | Sugerencia |
|---|---|
| `bodega_id` | `z.number().int().positive()` |
| `lote_id` | `z.number().int().positive()` |

### `KARDEX_BODEGA` *(solo select para el cliente)* ANGEL
| Campo | Sugerencia (uso interno del service) |
|---|---|
| `bodega_id` | `z.number().int().positive()` |
| `lote_id` | `z.number().int().positive()` |
| `tipo_movimiento` | `z.enum(['ING','SLD','MER','VNC','TRS'])` |
| `cantidad` | `z.number().positive().finite()` |

### `ALACENA` ANGEL
| Campo | Sugerencia |
|---|---|
| `bodega_id` | `z.number().int().positive().optional()` (columna nullable) |
| `alacena` | `z.string().trim().min(2).max(100)` |

### `STOCK_ALACENA` *(solo select)*
| Campo | Sugerencia |
|---|---|
| `alacena_id` | `z.number().int().positive().optional()` |
| `lote_id` | `z.number().int().positive().optional()` |

### `KARDEX_ALACENA` *(solo select para el cliente)*
| Campo | Sugerencia (uso interno) |
|---|---|
| `tipo_movimiento` | `z.enum(['ING','SLD','MER','VNC','TRS'])` |
| `cantidad` | `z.number().positive().finite()` |

---

## D. Productos y ventas

### `PRODUCTO`
| Campo | Sugerencia |
|---|---|
| `categoria_id` | `z.number().int().positive()` |
| `unidad_medida_id` | `z.number().int().positive()` |
| `producto` | `z.string().trim().min(2).max(150)` |
| `precio` | `z.number().positive().multipleOf(0.01)` |
| `stock_minimo` *(columna a agregar — global)* | `z.number().nonnegative()` |

### `PEDIDO`
| Campo | Sugerencia |
|---|---|
| `cliente_id` | `z.number().int().positive()` |
| `observaciones` | `z.string().trim().max(255).optional()` |
| `estado` | `z.enum(['CREADO','LST','ANL','ENR','ENT'])` — en el insert normalmente lo omites (usa el default `CREADO`) y solo lo validas en el endpoint de transición |

### `DETALLE_PEDIDO`
| Campo | Sugerencia |
|---|---|
| `producto_id` | `z.number().int().positive()` |
| `cantidad` | `z.number().positive().finite()` |

> Nota: en `db.ts` la columna `pedido_id` de esta tabla **no tiene `.notNull()`**. En el Zod del objeto compuesto (`POST /pedidos`) igual trátalo como requerido — pero considera agregar `.notNull()` en el schema de Drizzle para que la base de datos también lo exija.

### `FACTURA_VENTA`
| Campo | Sugerencia |
|---|---|
| `pedido_id` | `z.number().int().positive()` |
| `serie` | `z.string().trim().min(1).max(15)` |
| `numero` | `z.string().trim().min(1).max(32)` |
| `total` | `z.number().positive().multipleOf(0.01)` |

---

## E. Compras y proveedores

### `PROVEEDOR`
| Campo | Sugerencia |
|---|---|
| `no_nit` | `z.string().trim().regex(/^[0-9]{1,12}(-[0-9kK])?$/, 'NIT inválido').max(13)` (ajusta el regex al formato real que uses) |
| `proveedor` | `z.string().trim().min(2).max(150)` |
| `direccion` | `z.string().trim().max(255).optional()` |

### `ORDEN_COMPRA`
| Campo | Sugerencia |
|---|---|
| `proveedor_id` | `z.number().int().positive().optional()` (columna nullable) |
| `sucursal_destino` | `z.number().int().positive().optional()` |
| `estado_orden` | `z.enum(['CRD','ENP','FNL','ANL'])` |

### `DETALLE_ORDEN_COMPRA`
| Campo | Sugerencia |
|---|---|
| `orden_compra_id` | `z.number().int().positive()` |
| `materia_prima_id` | `z.number().int().positive()` |
| `cantidad_solicitada` | `z.number().positive().finite()` |
| `precio_unitario` | `z.number().positive().multipleOf(0.01)` |
| `subtotal` | `z.number().positive().multipleOf(0.01)` — considera `.refine` a nivel objeto: `subtotal === cantidad_solicitada * precio_unitario` |

### `HOJA_RECEPCION`
| Campo | Sugerencia |
|---|---|
| `sucursal_receptora` | `z.number().int().positive().optional()` |
| `orden_compra_id` | `z.number().int().positive().optional()` |
| `tipo_recepcion` | `z.enum(['Total','Parcial'])` |

### `HOJA_RECEPCION_DETALLE`
| Campo | Sugerencia |
|---|---|
| `materia_prima_id` | `z.number().int().positive().optional()` |
| `cantidad_recibida` | `z.number().positive().finite()` |
| `fecha_vencimiento` | `z.string().datetime()` (aquí es `timestamp`, no `date`, a diferencia de `LOTE_MATERIA_PRIMA`) |
| `merma` | `z.number().nonnegative().finite().optional()` |
| `saldo` | `z.number().nonnegative().finite()` — considera `.refine`: `saldo === cantidad_recibida - (merma ?? 0)` |
| `estado` | `z.enum(['Completa','Incompleta'])` |

### `FACTURA_COMPRA`
| Campo | Sugerencia |
|---|---|
| `hoja_recepcion_id` | `z.number().int().positive().optional()` |
| `serie` | `z.string().trim().min(1).max(15)` |
| `numero` | `z.string().trim().min(1).max(32)` |
| `fecha_emision` | `z.string().date()` |
| `total` | `z.number().positive().multipleOf(0.01)` |

---

## F. Producción / cocina

### `RECETA`
| Campo | Sugerencia |
|---|---|
| `producto_id` | `z.number().int().positive().optional()` |
| `nombre` | `z.string().trim().min(2).max(150)` |
| `cantidad_lote` | `z.number().positive().finite()` |

### `RECETA_DETALLE`
| Campo | Sugerencia |
|---|---|
| `receta_id` | `z.number().int().positive().optional()` |
| `materia_prima_id` | `z.number().int().positive().optional()` |
| `cantidad_necesaria` | `z.number().positive().finite()` |

### `ORDEN_TRABAJO`
| Campo | Sugerencia |
|---|---|
| `sucursal_id` | `z.number().int().positive().optional()` |
| `receta_id` | `z.number().int().positive().optional()` |
| `cantidad_produccion` | `z.number().positive().finite().optional()` |
| `estado` | `z.enum(['GENERADA','EN PROCESO','ANULADA','FINALIZADA'])` — ⚠️ en `db.ts` esta columna no tiene `.notNull()` ni `.default()`; considera agregarle `.default('GENERADA')` en Drizzle para no depender solo del Zod |

### `PRODUCTO_LOTE` *(solo select para el cliente)*
| Campo | Sugerencia |
|---|---|
| `cantidad_inicial` | `z.number().positive().finite().optional()` |
| `cantidad_actual` | `z.number().nonnegative().finite().optional()` |
| `estado` | `z.enum(['Vigente','Vencido','Agotado']).optional()` |

---

## G. Despacho / logística

### `HOJA_DESPACHO`
| Campo | Sugerencia |
|---|---|
| `pedido_id` | `z.number().int().positive().optional()` |
| `sucursal_despacho` | `z.number().int().positive().optional()` |

### `HOJA_DESPACHO_DETALLE`
| Campo | Sugerencia |
|---|---|
| `hoja_despacho_id` | `z.number().int().positive().optional()` |
| `producto_lote_id` | `z.number().int().positive().optional()` |
| `cantidad_despachada` | `z.number().positive().finite().optional()` |

---

## H. Caja y finanzas

### `CAJA`
| Campo | Sugerencia |
|---|---|
| `sucursal_id` | `z.number().int().positive().optional()` |
| `tipo` | `z.enum(['Caja chica','GastosR','Transito']).optional()` |
| `nombre` | `z.string().trim().min(2).max(100).optional()` |

### `TURNO_DESPACHADOR`
| Campo | Sugerencia |
|---|---|
| `caja_id` | `z.number().int().positive().optional()` |
| `usuario_id` | `z.number().int().positive().optional()` |
| `administrador_id` | `z.number().int().positive().optional()` — ⚠️ en `db.ts` esta columna referencia `SUCURSAL.id`, no `USUARIO.id`; revisa si es error, porque un "administrador" debería ser un usuario |
| `monto_apertura` | `z.number().nonnegative().multipleOf(0.01).optional()` |
| `monto_cierre_declarado` | `z.number().nonnegative().multipleOf(0.01).optional()` |
| `monto_cierre_sistema` | `z.number().nonnegative().multipleOf(0.01).optional()` |

### `LIQUIDACION_REPARTIDOR`
| Campo | Sugerencia |
|---|---|
| `turno_id` | `z.number().int().positive().optional()` |
| `repartidor_id` | `z.number().int().positive().optional()` |
| `monto_entregado_repartidor` | `z.number().nonnegative().multipleOf(0.01).optional()` |
| `monto_recaudado_efectivo` | `z.number().nonnegative().multipleOf(0.01).optional()` |
| `monto_recaudado_voucher` | `z.number().nonnegative().multipleOf(0.01).optional()` |

### `GASTOS_SUCURSAL`
| Campo | Sugerencia |
|---|---|
| `caja_id` | `z.number().int().positive().optional()` |
| `usuario_id` | `z.number().int().positive().optional()` |
| `sucursal_id` | `z.number().int().positive().optional()` |
| `monto_apertura` … `monto_cierre_sistema` | mismo criterio que `TURNO_DESPACHADOR` — pero revisa primero el pendiente ya anotado en `copac-plan-metodos.md` sobre si estas columnas tienen sentido aquí |

---

## Nota general sobre `.optional()`

Muchos FKs en `db.ts` quedaron sin `.notNull()` (probablemente sin querer, dado el patrón del resto de la tabla). Te los marqué como `.optional()` arriba **reflejando el schema tal cual está**, no porque sea la regla de negocio correcta. Es buen momento para que decidas, tabla por tabla, cuáles de esos FKs deberían ser obligatorios y agregar `.notNull()` en Drizzle antes de fijar el Zod definitivo — así no validas "opcional" algo que en realidad siempre debería venir.
