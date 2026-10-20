# Flujos de la API (guía para frontend)

Todas las respuestas tienen la forma `{ "data": ..., "error": null | "mensaje" }`. Los errores de validación agregan `details: [{ field, message }]`.
Cada respuesta incluye el header `X-Request-Id` (envíalo al reportar un problema; se puede fijar enviando el mismo header).

Códigos habituales: `400` datos inválidos · `401` sin sesión / sesión cerrada · `403` sin permiso · `404` no existe (o no es tuyo) · `409` conflicto de estado / stock · `502` fallo de un servicio externo.

## 1. Cliente final
1. `POST /cliente/auth/registro` → `201` con `token` (contraseña ≥ 8 caracteres).
2. Login con 2FA: `POST /cliente/auth/login` → `202 { tmpToken }` → `POST /cliente/auth/verificar { tmpToken, codigo }` → `200 { token }`.
3. Dirección: `POST /direcciones { municipio_id, direccion1, direccion2 }` (queda a nombre del cliente del token).
4. Pedido: `POST /pedidos`
   ```json
   { "direccion_id": 3, "sucursal_id": 1, "metodo_pago": "TARJETA",
     "items": [ { "producto_id": 1, "cantidad": 2, "extras": [{ "producto_extra_id": 4 }] },
                { "combo_id": 2, "cantidad": 1 } ] }
   ```
   - El total lo calcula el servidor. Un ítem es **producto o combo** (no ambos); los combos no admiten extras.
   - `tipo_entrega`: `DOMICILIO` (requiere `direccion_id`) o `RECOGER`. Si se omite: `DOMICILIO` con dirección, `RECOGER` sin ella.
5. Pago con tarjeta (solo si `metodo_pago = TARJETA`): `POST /pagos/checkout` (Stripe Checkout, devuelve `url`) o `POST /pagos/payment-intent` (Stripe Elements, `payment_method: "pm_..."`). El monto siempre es el del pedido.
   El pedido queda `pagado: true` cuando Stripe confirma (webhook `POST /pagos/webhook`).
6. Seguimiento: `GET /pedidos` (solo los suyos) · `GET /pedidos/:id`.
7. `POST /cliente/auth/logout` invalida el token.

## 2. Estados de un pedido
`CREADO → (EN_PREPARACION) → LISTO → EN_DESPACHO | EN_RUTA → ENTREGADO`; `ANULADO` desde cualquier estado no final.
- `PATCH /pedidos/:id/confirmar` (ADMIN, CAJERO): `CREADO → LISTO`. Con tarjeta exige `pagado = true` (409 si no).
- `PATCH /pedidos/:id/estado { estado }` (ADMIN): transiciones válidas; **anular un pedido pagado con tarjeta reembolsa en Stripe** (`reembolso_id` en la respuesta). Si el reembolso falla → `502` y el pedido NO se anula.
- `ENTREGADO` y `ANULADO` son finales.

## 3. Despacho y reparto
1. Despachador: `POST /hojas-despacho { pedido_id, sucursal_despacho, repartidor_id, items:[{ producto_lote_id, cantidad_despachada }] }`
   - Pedido debe estar `LISTO`. `repartidor_id` es obligatorio a domicilio.
   - Valida lotes vigentes y que no se despache más de lo pedido; descuenta el stock del lote.
   - Pedido → `EN_RUTA` (domicilio) o `EN_DESPACHO` (recoger).
2. Repartidor: `GET /repartidor/pedidos` (solo los suyos; `?todos=true` incluye cerrados) → `POST /pedidos/:id/incidente` → `PATCH /pedidos/:id/entregado`.
3. Facturación: `POST /facturas-venta { pedido_id, serie, numero }` (una por pedido; el total sale del pedido).

## 4. Compras e inventario
1. `POST /ordenes-compra` → `PATCH /ordenes-compra/:id/agendar` (queda `EN_PREPARACION`).
2. Recepción: `POST /hojas-recepcion { sucursal_receptora, bodega_id, orden_compra_id?, tipo_recepcion, items:[{ materia_prima_id, cantidad_recibida, merma?, fecha_vencimiento }] }`.
   Crea el lote, lo registra en la bodega y deja kardex. Una recepción `TOTAL` finaliza la orden.
3. Bodega → alacena: `POST /alacenas/traslados { bodega_id, alacena_id, lote_id, cantidad }`.
4. Bodega → bodega: `POST /traslados`. Ajuste físico: `POST /inventario/cuadre`. Ingreso sin orden: `POST /bodega/ingreso-vale`.
5. Merma en alacena: `POST /alacenas/mermas { alacena_id, lote_id, cantidad, tipo }` (el lote debe estar en esa alacena).

## 5. Producción
`POST /recetas` → `POST /ordenes-trabajo { sucursal_id, receta_id, cantidad_produccion }` → `PATCH …/iniciar` → `PATCH …/terminar`.
- `terminar` descuenta la materia prima de la sucursal (alacena primero, luego bodega, por vencimiento, sin lotes vencidos) y crea el lote de producto. Cantidad por ingrediente = `cantidad_necesaria × cantidad_produccion / cantidad_lote`.
- Sin stock suficiente → `409` y no se modifica nada. Una orden no se puede terminar dos veces.
- No se finaliza por `PATCH …/estado` (responde 400).

## 6. Permisos (resumen)
| Rol | Puede |
|---|---|
| CLIENTE | Su perfil, direcciones, pedidos y pagos |
| CAJERO | Crear pedidos y clientes, confirmar pedidos, facturas de venta, turnos |
| DESPACHADOR | Hojas de despacho, turnos |
| REPARTIDOR | Sus pedidos asignados, incidentes, entrega, su liquidación |
| BODEGUERO | Bodega, recepción, traslados, cuadre |
| COCINERO / JEFE_COCINA | Órdenes de trabajo (iniciar/terminar), solicitudes de insumo, mermas de alacena |
| COMPRAS / GERENTE | Lectura de compras y reportes |
| ADMIN | Todo, incluida la gestión de usuarios (`activo: false` desactiva y cierra sus sesiones) |
