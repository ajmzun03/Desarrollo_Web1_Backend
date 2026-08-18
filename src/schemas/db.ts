import { pgTable, varchar, integer, bigint, timestamp, boolean, date, doublePrecision } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core"; //Mucha, aquí declaramos el enum para el estado del lote de materia prima

export const estadoLoteEnum = pgEnum('estado_lote', [
  'VIGENTE', //Abierto: disponible para consumo o transferencia
  'VENCIDO', //Vencido: superó la fecha de caducidad y no puede ser consumido
  'AGOTADO' //Agotado: no hay más unidades disponibles
]);

export const estadoPedidoEnum = pgEnum('estado_pedido', [
  'CREADO',
  'EN_PROCESO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO'
]);

export const estadoOrdenEnum = pgEnum('estado', [
  'PENDIENTE',   // orden creada, aún no enviada al proveedor
  'ENVIADA',     // enviada al proveedor
  'CONFIRMADA',  // proveedor confirmó la orden
  'RECIBIDA',    // mercancía recibida (coincide con HOJA_RECEPCION)
  'CANCELADA'    // orden cancelada
]);

export const estadoRecepcion = pgEnum('estado_recepcion',[
  'COMPLETADO',
  'PENDIENTE'
])

export const sucursalTable = pgTable('sucursal', {
  id: integer('id').primaryKey(),
  municipio_id: integer('municipio_id').notNull(),
  sucursal: varchar('sucursal', { length: 100 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
})

export const clienteTable = pgTable('cliente', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellido: varchar('apellido', { length: 100 }).notNull(),
  telefono: varchar('telefono', { length: 50 }).notNull().unique(),
  telefono_ref: varchar('telefono_ref', { length: 50 }).notNull().unique(),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const municipioTable = pgTable('municipio', {
  id: integer('id').primaryKey(),
  departamento_id: integer('departamento_id').notNull(),
  municipio: varchar('municipio', { length: 100 }).notNull().unique()
})

export const departamentoTable = pgTable('departamento', {
  id: integer('id').primaryKey(),
  departamento: varchar('departamento', { length: 100 }).notNull().unique()
})

export const direccionTable = pgTable('direccion', {
  id: integer('id').primaryKey(),
  cliente_id: bigint('cliente_id', { mode: 'number' }).notNull(),
  municipio_id: integer('municipio_id').notNull(),
  direccion1: varchar('direccion', { length: 155 }).notNull(),
  direccion2: varchar('direccion2', { length: 100 }).notNull()
})

export const categoriaTable = pgTable('categoria', {
  id: integer('id').primaryKey(),
  categoria_id: integer('categoria_id').notNull().unique(),
  descripcion: varchar('descripcion', { length: 100 }).notNull(), //aquí le cambié el nombre del campo a "descripcion" porque se llamaba categoría
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const unidadMedidaTable = pgTable('unidad_medida', {
  id: integer('id').primaryKey(),
  unidad: varchar('unidad', { length: 50 }).notNull(),
  abreviatura: varchar('abreviatura', { length: 4 }).notNull().unique(),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const materiaPrimaTable = pgTable('materia_prima', {
  id: integer('id').primaryKey(),
  categoria_id: integer('categoria_id').notNull(),
  unidad_medida_id: integer('unidad_medida_id').notNull(),
  materia_prima: varchar('materia_prima', { length: 150 }).notNull(),
  es_perecedera: boolean('es_perecedera').notNull().default(false),
  maneja_merma: boolean('maneja_merma').notNull().default(false),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const loteMateriaPrimaTable = pgTable('lote_materia_prima', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  materia_prima_id: integer('materia_prima_id').notNull(),
  fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
  cantidad_inicial: doublePrecision('cantidad_inicial').notNull(),
  cantidad_actual: doublePrecision('cantidad_actual').notNull(),
  estado: estadoLoteEnum('estado').notNull().default('VIGENTE'),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const bodegaTable = pgTable('bodega', {
  id: integer('id').primaryKey(),
  sucursal_id: integer('sucursal_id').notNull(),
  bodega: varchar('bodega', { length: 100 }).notNull().unique()
})

export const stockBodegaTable = pgTable('stock_bodega', {
  id: integer('id').primaryKey(),
  bodega_id: integer('bodega_id').notNull(),
  lote_id: bigint('lote_id', { mode: 'number' }).notNull() //acá no deberíamos incluir cuánto hay en stock, porque eso lo manejamos en la tabla de lote_materia_prima, acá solo estamos diciendo que ese lote está en esa bodega
})

export const kardexBodegaTable = pgTable('kardex_bodega', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  bodega_id: integer('bodega_id').notNull(),
  lote_id: bigint('lote_id', { mode: 'number' }).notNull(),
  tipo_movimiento: varchar('tipo_movimiento', { length: 50 }).notNull(), //entrada o salida
  cantidad: doublePrecision('cantidad').notNull(),
  fecha_movimiento: timestamp('fecha_movimiento', { mode: 'string' }).notNull().defaultNow() //este campo no esta agregado en las tablas originales, lo dejo?  
})

export const alacenaTable = pgTable('ALACENA', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  bodega_id: integer('bodega_id'),
  alacena: varchar('alacena', { length: 100 }).notNull(),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const stockAlacenaTable = pgTable('STOCK_ALACENA', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  alacena_id: integer('alacena_id'),
  lote_id: bigint('lote_id', { mode: 'number' })
})

export const kardexAlacenaTable = pgTable('KARDEX_ALACENA', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  alacena_id: integer('alacena_id'),
  lote_id: bigint('lote_id', { mode: 'number' }),
  tipo_movimiento: varchar('tipo_movimiento', { length: 50 }).notNull(),
  cantidad: doublePrecision('cantidad').notNull(),
  fecha_movimiento: timestamp('fecha_movimiento', { mode: 'string' }).notNull().defaultNow()
})

export const productoTable = pgTable('PRODUCTO', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  categoria_id: integer('categoria_id').notNull(),
  unidad_medida_id: integer('unidad_medida_id').notNull(),
  producto: varchar('producto', { length: 150 }).notNull(),
  precio: doublePrecision('precio').notNull()
})

export const pedidoTable = pgTable('PEDIDO', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  cliente_id: bigint('cliente_id', { mode: 'number' }).notNull(),
  fecha_pedido: timestamp('fecha_pedido', { mode: 'string' }).notNull().defaultNow(),
  observaciones: varchar('observaciones', { length: 255 }),
  estado: estadoPedidoEnum('estado').notNull().default('CREADO')
})

export const detallePedidoTable = pgTable('DETALLE_PEDIDO', {
  id: bigint('id', { mode: 'number' }).notNull().primaryKey().generatedByDefaultAsIdentity(),
  pedido_id: bigint('pedido_id', { mode: 'number' }),
  producto_id: integer('pedido_id').notNull(),
  cantidad: doublePrecision('cantidad').notNull()
})

export const facturaVentaTable = pgTable('FACTURA_VENTA', {
  id: bigint('id', { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  pedido_id: bigint('pedido_id', { mode: "number" }).notNull(),
  serie: varchar('serie', { length: 15 }).notNull(),
  numero: varchar('numero', { length: 32 }).notNull(),
  fecha_emision: timestamp('fecha_emision', { mode: "string" }).notNull().defaultNow(),
  total: doublePrecision('total').notNull(),
  creado_en: timestamp('creado_en', { mode: "string" }).notNull().defaultNow()
})

export const proveedorTable = pgTable('PROVEEDOR', {
  id: integer('id').primaryKey(),
  no_nit: varchar('no_nit', { length: 13 }).notNull().unique(),
  proveedor: varchar('proveedor', { length: 150 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
})

export const ordenCompraTable = pgTable('ORDEN_COMPRA', {
  id: bigint('id',{mode:"number"}).notNull().primaryKey().generatedByDefaultAsIdentity(),
  proveedor_id: integer('proveedor_id'),
  sucursal_destino: integer('sucursal_destino'),
  fecha_generada: timestamp('fecha_generada',{mode:"string"}).notNull().defaultNow(),
  estado_orden: estadoOrdenEnum('estado_orden').notNull().default("PENDIENTE")
})

export const detalleOrdenCompraTable = pgTable('DETALLE_ORDEN_COMPRA', {
  id: bigint('id', {mode:"number"}).notNull().primaryKey().generatedByDefaultAsIdentity(),
  orden_compra_id: bigint('orden_compra_id', {mode:"number"}).notNull(),
  materia_prima_id: integer('materia_prima_id').notNull(),
  cantidad_solicitada: doublePrecision("cantidad_solicitada").notNull(),
  precio_unitario: doublePrecision('precio_unitario').notNull(),
  subtotal: doublePrecision('subtotal').notNull()
})

export const hojaRecepcionTable = pgTable("HOJA_RECEPCION", {
  id:bigint('id',{ mode:"number"}).notNull().primaryKey().generatedByDefaultAsIdentity(),
  sucursal_receptora: integer('sucursal_receptora'),
  orden_compra_id: bigint('orden_compra_id',{mode:"number"}),
  recepcion_parcial: boolean('recepcion_parcial').notNull().default(false),
  fecha_generada: timestamp('fecha_generada',{mode:'string'}).notNull().defaultNow()
})

export const hojaRecepcionDetalleTable = pgTable("HOJA_RECEPCION_DETALLE", {
  id: bigint('id',{mode:"number"}).primaryKey().generatedByDefaultAsIdentity(),
  hoja_recepcion_id: bigint('hoja_recepcion_id',{mode:"number"}),
  materia_prima_id: integer('materia_prima_id'),
  cantidad_recibida: doublePrecision('cantidad_recibida').notNull(),
  fecha_vencimiento: timestamp('fecha_vencimiento',{mode:"string"}).notNull().defaultNow(),
  merma: doublePrecision('merma'),
  saldo: doublePrecision('saldo').notNull(),
  estado: estadoRecepcion('estado_recepcion').notNull().default('PENDIENTE')
})