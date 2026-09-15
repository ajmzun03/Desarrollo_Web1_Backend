import { pgTable, varchar, integer, bigint, timestamp, boolean, date, doublePrecision } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
export const movimientoEnum = pgEnum('movimiento', [
    'INGRESO', // ingreso de producto/materia prima
    'SALIDA', // salida de producto/materia prima
    'MERMA', // merma de producto/materia prima
    'VENCIMIENTO', // vencimiento de producto/materia prima
    'TRASLADO' // traslado de producto/materia prima
]);
export const estadoLoteEnum = pgEnum('estado_lote', [
    'VIGENTE',
    'VENCIDO',
    'AGOTADO'
]);
export const estadoPedidoEnum = pgEnum('estado_pedido', [
    'CREADO',
    'LISTO',
    'ANULADO',
    'EN_RUTA',
    'ENTREGADO'
]);
export const estadoOrdenCompraEnum = pgEnum('estado_orden_compra', [
    'CREADA',
    'EN_PROCESO',
    'FINALIZADO',
    'ANULADO'
]);
export const tipoRecepcionEnum = pgEnum('tipo_recepcion', [
    'TOTAL',
    'PARCIAL'
]);
export const estadoRecepcionEnum = pgEnum('estado_recepcion', [
    'COMPLETA',
    'INCOMPLETA'
]);
export const estadoOrdenTrabajoEnum = pgEnum('estado_orden_trabajo', [
    'GENERADA',
    'EN_PROCESO',
    'ANULADA',
    'FINALIZADA'
]);
export const tipoCajaEnum = pgEnum('tipo_caja', [
    'CAJA_CHICA',
    'GASTOS_REPRESENTACION', // ojo: "GastosR" era ambiguo, ajusta el nombre completo si el significado es otro
    'TRANSITO'
]);
export const rolUsuarioEnum = pgEnum('rol_usuario', [
    'ADMIN',
    'BODEGUERO',
    'DESPACHADOR',
    'REPARTIDOR',
    'CAJERO'
]);
export const sucursalTable = pgTable('SUCURSAL', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    municipio_id: integer('municipio_id').notNull().references(() => municipioTable.id),
    sucursal: varchar('sucursal', { length: 100 }).notNull().unique(),
    direccion: varchar('direccion', { length: 255 })
});
export const clienteTable = pgTable('CLIENTE', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    apellido: varchar('apellido', { length: 100 }).notNull(),
    telefono: varchar('telefono', { length: 50 }).notNull().unique(),
    telefono_ref: varchar('telefono_ref', { length: 50 }).notNull().unique(),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const municipioTable = pgTable('MUNICIPIO', {
    id: integer('id').primaryKey(),
    departamento_id: integer('departamento_id').notNull().references(() => departamentoTable.id),
    municipio: varchar('municipio', { length: 100 }).notNull().unique()
});
export const departamentoTable = pgTable('DEPARTAMENTO', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    departamento: varchar('departamento', { length: 100 }).notNull().unique()
});
export const direccionTable = pgTable('DIRECCION', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    cliente_id: bigint('cliente_id', { mode: 'number' }).notNull().references(() => clienteTable.id),
    municipio_id: integer('municipio_id').notNull().references(() => municipioTable.id),
    direccion1: varchar('direccion', { length: 155 }).notNull(),
    direccion2: varchar('direccion2', { length: 100 }).notNull()
});
export const categoriaTable = pgTable('CATEGORIA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    categoria_id: integer('categoria_id').notNull().unique(),
    descripcion: varchar('descripcion', { length: 100 }).notNull(), //aquí le cambié el nombre del campo a "descripcion" porque se llamaba categoría
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const unidadMedidaTable = pgTable('UNIDAD_MEDIDA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    unidad: varchar('unidad', { length: 50 }).notNull(),
    abreviatura: varchar('abreviatura', { length: 4 }).notNull().unique(),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const materiaPrimaTable = pgTable('MATERIA_PRIMA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    categoria_id: integer('categoria_id').notNull().references(() => categoriaTable.id),
    unidad_medida_id: integer('unidad_medida_id').notNull().references(() => unidadMedidaTable.id),
    materia_prima: varchar('materia_prima', { length: 150 }).notNull(),
    es_perecedera: boolean('es_perecedera').notNull().default(false),
    maneja_merma: boolean('maneja_merma').notNull().default(false),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const loteMateriaPrimaTable = pgTable('LOTE_MATERIA_PRIMA', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    materia_prima_id: integer('materia_prima_id').notNull().references(() => materiaPrimaTable.id),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
    cantidad_inicial: doublePrecision('cantidad_inicial').notNull(),
    cantidad_actual: doublePrecision('cantidad_actual').notNull(),
    estado: estadoLoteEnum('estado').notNull().default('VIGENTE'),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const bodegaTable = pgTable('BODEGA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    sucursal_id: integer('sucursal_id').notNull().references(() => sucursalTable.id),
    bodega: varchar('bodega', { length: 100 }).notNull().unique()
});
export const stockBodegaTable = pgTable('STOCK_BODEGA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    bodega_id: integer('bodega_id').notNull().references(() => bodegaTable.id),
    lote_id: bigint('lote_id', { mode: 'number' }).notNull().references(() => loteMateriaPrimaTable.id) //acá no deberíamos incluir cuánto hay en stock, porque eso lo manejamos en la tabla de lote_materia_prima, acá solo estamos diciendo que ese lote está en esa bodega
});
export const kardexBodegaTable = pgTable('KARDEX_BODEGA', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    bodega_id: integer('bodega_id').notNull().references(() => bodegaTable.id),
    lote_id: bigint('lote_id', { mode: 'number' }).notNull().references(() => loteMateriaPrimaTable.id),
    tipo_movimiento: movimientoEnum('movimiento').notNull(),
    cantidad: doublePrecision('cantidad').notNull(),
    fecha_movimiento: timestamp('fecha_movimiento', { mode: 'string' }).notNull().defaultNow() //este campo no esta agregado en las tablas originales, lo dejo?  
});
export const alacenaTable = pgTable('ALACENA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    bodega_id: integer('bodega_id').references(() => bodegaTable.id),
    alacena: varchar('alacena', { length: 100 }).notNull(),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
export const stockAlacenaTable = pgTable('STOCK_ALACENA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    alacena_id: integer('alacena_id').references(() => alacenaTable.id),
    lote_id: bigint('lote_id', { mode: 'number' }).references(() => loteMateriaPrimaTable.id)
});
export const kardexAlacenaTable = pgTable('KARDEX_ALACENA', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    alacena_id: integer('alacena_id').references(() => alacenaTable.id),
    lote_id: bigint('lote_id', { mode: 'number' }).references(() => loteMateriaPrimaTable.id),
    tipo_movimiento: movimientoEnum('movimiento').notNull(),
    cantidad: doublePrecision('cantidad').notNull(),
    fecha_movimiento: timestamp('fecha_movimiento', { mode: 'string' }).notNull().defaultNow()
});
export const productoTable = pgTable('PRODUCTO', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    categoria_id: integer('categoria_id').notNull().references(() => categoriaTable.id),
    unidad_medida_id: integer('unidad_medida_id').notNull().references(() => unidadMedidaTable.id),
    producto: varchar('producto', { length: 150 }).notNull(),
    precio: doublePrecision('precio').notNull()
});
export const pedidoTable = pgTable('PEDIDO', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    cliente_id: bigint('cliente_id', { mode: 'number' }).notNull().references(() => clienteTable.id),
    fecha_pedido: timestamp('fecha_pedido', { mode: 'string' }).notNull().defaultNow(),
    observaciones: varchar('observaciones', { length: 255 }),
    estado: estadoPedidoEnum('estado').notNull().default('CREADO')
});
export const detallePedidoTable = pgTable('DETALLE_PEDIDO', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    pedido_id: bigint('pedido_id', { mode: 'number' }).references(() => pedidoTable.id),
    producto_id: integer('producto_id').notNull().references(() => productoTable.id),
    cantidad: doublePrecision('cantidad').notNull()
});
export const facturaVentaTable = pgTable('FACTURA_VENTA', {
    id: bigint('id', { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    pedido_id: bigint('pedido_id', { mode: "number" }).notNull().references(() => pedidoTable.id),
    serie: varchar('serie', { length: 15 }).notNull(),
    numero: varchar('numero', { length: 32 }).notNull(),
    fecha_emision: timestamp('fecha_emision', { mode: "string" }).notNull().defaultNow(),
    total: doublePrecision('total').notNull(),
    creado_en: timestamp('creado_en', { mode: "string" }).notNull().defaultNow()
});
export const proveedorTable = pgTable('PROVEEDOR', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    no_nit: varchar('no_nit', { length: 13 }).notNull().unique(),
    proveedor: varchar('proveedor', { length: 150 }).notNull().unique(),
    direccion: varchar('direccion', { length: 255 })
});
export const ordenCompraTable = pgTable('ORDEN_COMPRA', {
    id: bigint('id', { mode: "number" }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    proveedor_id: integer('proveedor_id').references(() => proveedorTable.id),
    sucursal_destino: integer('sucursal_destino').references(() => sucursalTable.id),
    fecha_generada: timestamp('fecha_generada', { mode: "string" }).notNull().defaultNow(),
    estado_orden: estadoOrdenCompraEnum('estado_orden').notNull().default("CREADA")
});
export const detalleOrdenCompraTable = pgTable('DETALLE_ORDEN_COMPRA', {
    id: bigint('id', { mode: "number" }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    orden_compra_id: bigint('orden_compra_id', { mode: "number" }).notNull().references(() => ordenCompraTable.id),
    materia_prima_id: integer('materia_prima_id').notNull().references(() => materiaPrimaTable.id),
    cantidad_solicitada: doublePrecision("cantidad_solicitada").notNull(),
    precio_unitario: doublePrecision('precio_unitario').notNull(),
    subtotal: doublePrecision('subtotal').notNull()
});
export const hojaRecepcionTable = pgTable("HOJA_RECEPCION", {
    id: bigint('id', { mode: "number" }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    sucursal_receptora: integer('sucursal_receptora').references(() => sucursalTable.id),
    orden_compra_id: bigint('orden_compra_id', { mode: "number" }).references(() => ordenCompraTable.id),
    tipo_recepcion: tipoRecepcionEnum('tipo_recepcion').notNull().default('TOTAL'),
    fecha_generada: timestamp('fecha_generada', { mode: 'string' }).notNull().defaultNow()
});
export const hojaRecepcionDetalleTable = pgTable("HOJA_RECEPCION_DETALLE", {
    id: bigint('id', { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    hoja_recepcion_id: bigint('hoja_recepcion_id', { mode: "number" }).references(() => hojaRecepcionTable.id),
    materia_prima_id: integer('materia_prima_id').references(() => materiaPrimaTable.id),
    cantidad_recibida: doublePrecision('cantidad_recibida').notNull(),
    fecha_vencimiento: timestamp('fecha_vencimiento', { mode: "string" }).notNull().defaultNow(),
    merma: doublePrecision('merma'),
    saldo: doublePrecision('saldo').notNull(),
    estado: estadoRecepcionEnum('estado_recepcion').notNull().default('COMPLETA')
});
//Carlos Hernández
// ---- Compras: factura ligada a la hoja de recepción ----
export const facturaCompraTable = pgTable('FACTURA_COMPRA', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    hoja_recepcion_id: bigint('hoja_recepcion_id', { mode: 'number' }).references(() => hojaRecepcionTable.id), // HOJA_RECEPCION.id
    serie: varchar('serie', { length: 15 }).notNull(),
    numero: varchar('numero', { length: 32 }).notNull(),
    fecha_emision: date('fecha_emision', { mode: 'string' }).notNull(),
    total: doublePrecision('total').notNull(),
    fecha_ingreso: timestamp('fecha_ingreso', { mode: 'string' }).notNull().defaultNow()
});
// ---- Orden de trabajo: ejecuta una receta, produce un PRODUCTO_LOTE ----
export const ordenTrabajoTable = pgTable('ORDEN_TRABAJO', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    sucursal_id: integer('sucursal_id').references(() => sucursalTable.id), // SUCURSAL.id - sucursal que produjo el lote
    receta_id: integer('receta_id').references(() => recetaTable.id), // RECETA.id
    cantidad_produccion: doublePrecision('cantidad_produccion'), // multiplicador de cantidad producida por receta
    estado: estadoOrdenTrabajoEnum('estado')
});
// ---- Lote de producto terminado, generado por una orden de trabajo ----
export const productoLoteTable = pgTable('PRODUCTO_LOTE', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    orden_id: bigint('orden_id', { mode: 'number' }).references(() => ordenTrabajoTable.id), // ORDEN_TRABAJO.id
    cantidad_inicial: doublePrecision('cantidad_inicial'),
    cantidad_actual: doublePrecision('cantidad_actual'),
    estado: estadoLoteEnum('estado').default('VIGENTE'),
    producido_en: timestamp('producido_en', { mode: 'string' }).notNull().defaultNow()
});
// ---- Receta: produce un producto a partir de materia prima ----
export const recetaTable = pgTable('RECETA', {
    id: integer('id').notNull().primaryKey().generatedByDefaultAsIdentity(),
    producto_id: integer('producto_id').references(() => productoTable.id), // PRODUCTO.id
    nombre: varchar('nombre', { length: 150 }).notNull(),
    cantidad_lote: doublePrecision('cantidad_lote').notNull(), // cantidad esperada producida por receta
    creada_en: timestamp('creada_en', { mode: 'string' }).notNull().defaultNow()
});
export const recetaDetalleTable = pgTable('RECETA_DETALLE', {
    id: integer('id').notNull().primaryKey().generatedByDefaultAsIdentity(),
    receta_id: integer('receta_id').references(() => recetaTable.id), // RECETA.id
    materia_prima_id: integer('materia_prima_id').references(() => materiaPrimaTable.id), // MATERIA_PRIMA.id
    cantidad_necesaria: doublePrecision('cantidad_necesaria').notNull()
});
// ---- Hoja de despacho: despacha lotes de producto por pedido ----
export const hojaDespachoTable = pgTable('HOJA_DESPACHO', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    pedido_id: bigint('pedido_id', { mode: 'number' }).references(() => pedidoTable.id), // PEDIDO.id
    sucursal_despacho: integer('sucursal_despacho').references(() => sucursalTable.id), // SUCURSAL.id
    despachado_en: timestamp('despachado_en', { mode: 'string' }).notNull().defaultNow()
});
export const hojaDespachoDetalleTable = pgTable('HOJA_DESPACHO_DETALLE', {
    id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
    hoja_despacho_id: bigint('hoja_despacho_id', { mode: 'number' }).references(() => hojaDespachoTable.id), // HOJA_DESPACHO.id
    producto_lote_id: integer('producto_lote_id').references(() => productoLoteTable.id), // PRODUCTO_LOTE.id
    cantidad_despachada: doublePrecision('cantidad_despachada')
});
// ---- Caja: registro de cajas por sucursal ----
export const cajaTable = pgTable('CAJA', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    sucursal_id: integer('sucursal_id').references(() => sucursalTable.id), // SUCURSAL.id
    tipo: tipoCajaEnum('tipo'),
    nombre: varchar('nombre', { length: 100 })
});
// ---- Turno del despachador: apertura/cierre de caja con arqueo ----
export const turnoDespachadorTable = pgTable('TURNO_DESPACHADOR', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    caja_id: integer('caja_id').references(() => cajaTable.id), // CAJA.id
    usuario_id: integer('usuario_id').references(() => usuarioTable.id), // USUARIO.id
    administrador_id: integer('administrador_id').references(() => sucursalTable.id),
    monto_apertura: doublePrecision('monto_apertura'), // el sencillo entregado
    monto_cierre_declarado: doublePrecision('monto_cierre_declarado'), // arqueo ciego
    monto_cierre_sistema: doublePrecision('monto_cierre_sistema'), // lo que el sistema calculó
    abierto_en: timestamp('abierto_en', { mode: 'string' }),
    cerrado_en: timestamp('cerrado_en', { mode: 'string' })
});
// ---- Liquidación del repartidor al cerrar su ruta dentro de un turno ----
export const liquidacionRepartidorTable = pgTable('LIQUIDACION_REPARTIDOR', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    turno_id: bigint('turno_id', { mode: 'number' }).references(() => turnoDespachadorTable.id), // TURNO_DESPACHADOR.id
    repartidor_id: integer('repartidor_id').references(() => usuarioTable.id), // USUARIO.id
    monto_entregado_repartidor: doublePrecision('monto_entregado_repartidor'), // sencillo para ruta
    monto_recaudado_efectivo: doublePrecision('monto_recaudado_efectivo'),
    monto_recaudado_voucher: doublePrecision('monto_recaudado_voucher'),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
// ---- Gastos registrados contra una caja/sucursal ----
export const gastosSucursalTable = pgTable('GASTOS_SUCURSAL', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    caja_id: integer('caja_id').references(() => cajaTable.id), // CAJA.id
    usuario_id: integer('usuario_id').references(() => usuarioTable.id), // USUARIO.id
    sucursal_id: integer('sucursal_id').references(() => sucursalTable.id), // SUCURSAL.id
    monto_apertura: doublePrecision('monto_apertura'), // el sencillo entregado
    monto_cierre_declarado: doublePrecision('monto_cierre_declarado'), // arqueo ciego
    monto_cierre_sistema: doublePrecision('monto_cierre_sistema'), // lo que el sistema calculó
    abierto_en: timestamp('abierto_en', { mode: 'string' }),
    cerrado_en: timestamp('cerrado_en', { mode: 'string' })
});
// ---- Usuarios del sistema ----
export const usuarioTable = pgTable('USUARIO', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    usuario: varchar('usuario', { length: 50 }),
    correo_electronico: varchar('correo_electronico', { length: 255 }), // encriptado con sha256 a nivel de aplicación
    contrasenia: varchar('contrasenia', { length: 50 }), // encriptado con sha256 a nivel de aplicación
    rol: rolUsuarioEnum('rol_usuario').notNull(),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
});
//# sourceMappingURL=db.schema.js.map