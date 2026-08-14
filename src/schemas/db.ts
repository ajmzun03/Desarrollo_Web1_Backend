<<<<<<< HEAD
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const proveedorTable = pgTable('proveedor',{
  id: serial('id').primaryKey(),
  no_nit: varchar('no_nit', { length: 13 }).notNull().unique(),
  proveedor: varchar('proveedor', { length: 150 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
=======
import { pgTable, varchar, integer , bigint, timestamp, boolean, date, doublePrecision } from "drizzle-orm/pg-core";

import { pgEnum } from "drizzle-orm/pg-core"; //Mucha, aquí declaramos el enum para el estado del lote de materia prima
export const estadoLoteEnum = pgEnum('estado_lote', [
    'VIGENTE', //Abierto: disponible para consumo o transferencia
    'VENCIDO', //Vencido: superó la fecha de caducidad y no puede ser consumido
    'AGOTADO' //Agotado: no hay más unidades disponibles
]);

//Si necesitan declarar otro "ESTADO" para otro tipo de tabla, pueden declararlo de la misma manera que el estadoLoteEnum, solo cambien el nombre del enum y los valores que necesiten.


export const proveedorTable = pgTable('proveedor',{
  id: integer('id').primaryKey(),
  no_nit: varchar('no_nit', { length: 13 }).notNull().unique(),
  proveedor: varchar('proveedor', { length: 150 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
})

export const sucursalTable = pgTable('sucursal',{
  id: integer('id').primaryKey(),
  municipio_id: integer('municipio_id').notNull(),
  sucursal: varchar('sucursal', { length: 100 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
})

export const clienteTable = pgTable('cliente',{
  id: bigint('id',{mode: 'number'}).primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellido: varchar('apellido', { length: 100 }).notNull(),
  telefono: varchar('telefono', { length: 50 }).notNull().unique(),
  telefono_ref: varchar('telefono_ref', { length: 50 }).notNull().unique(),
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})


export const municipioTable = pgTable('municipio',{
  id: integer('id').primaryKey(),
  departamento_id: integer('departamento_id').notNull(),
  municipio: varchar('municipio', { length: 100 }).notNull().unique()
})

export const departamentoTable = pgTable('departamento',{
  id: integer('id').primaryKey(),
  departamento: varchar('departamento', { length: 100 }).notNull().unique()
})

export const direccionTable = pgTable('direccion',{
  id: integer('id').primaryKey(),
  cliente_id: bigint('cliente_id',{mode: 'number'}).notNull(),
  municipio_id: integer('municipio_id').notNull(),
  direccion1: varchar('direccion', { length: 155 }).notNull(),
  direccion2: varchar('direccion2', { length: 100 }).notNull()
})

export const categoriaTable = pgTable('categoria',{
  id: integer('id').primaryKey(),
  categoria_id: integer('categoria_id').notNull().unique(),
  descripcion: varchar('descripcion', { length: 100 }).notNull(), //aquí le cambié el nombre del campo a "descripcion" porque se llamaba categoría
  creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const unidadMedidaTable = pgTable('unidad_medida',{
    id: integer('id').primaryKey(),
    unidad: varchar('unidad', { length: 50 }).notNull(),
    abreviatura: varchar('abreviatura', { length: 4 }).notNull().unique(),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const materiaPrimaTable = pgTable('materia_prima',{
    id: integer('id').primaryKey(),
    categoria_id: integer('categoria_id').notNull(),
    unidad_medida_id: integer('unidad_medida_id').notNull(),
    materia_prima: varchar('materia_prima', { length: 150 }).notNull(),
    es_perecedera: boolean('es_perecedera').notNull().default(false),
    maneja_merma: boolean('maneja_merma').notNull().default(false),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const loteMateriaPrimaTable = pgTable('lote_materia_prima',{
    id: bigint('id',{mode: 'number'}).primaryKey(),
    materia_prima_id: integer('materia_prima_id').notNull(),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
    cantidad_inicial: doublePrecision('cantidad_inicial').notNull(),
    cantidad_actual: doublePrecision('cantidad_actual').notNull(),
    estado: estadoLoteEnum('estado').notNull().default('VIGENTE'),
    creado_en: timestamp('creado_en', { mode: 'string' }).notNull().defaultNow()
})

export const bodegaTable = pgTable('bodega',{
    id: integer('id').primaryKey(),
    sucursal_id: integer('sucursal_id').notNull(),
    bodega: varchar('bodega', { length: 100 }).notNull().unique()
})

export const stockBodegaTable = pgTable('stock_bodega',{
    id: integer('id').primaryKey(),
    bodega_id: integer('bodega_id').notNull(),
    lote_id: bigint('lote_id',{mode: 'number'}).notNull(), //acá no deberíamos incluir cuánto hay en stock, porque eso lo manejamos en la tabla de lote_materia_prima, acá solo estamos diciendo que ese lote está en esa bodega
})

export const kardexBodegaTable = pgTable('kardex_bodega',{
    id: bigint('id',{mode: 'number'}).primaryKey(),
    bodega_id: integer('bodega_id').notNull(),
    lote_id: bigint('lote_id',{mode: 'number'}).notNull(),
    tipo_movimiento: varchar('tipo_movimiento', { length: 50 }).notNull(), //entrada o salida
    cantidad: doublePrecision('cantidad').notNull(),
    fecha_movimiento: timestamp('fecha_movimiento', { mode: 'string' }).notNull().defaultNow() //este campo no esta agregado en las tablas originales, lo dejo?  
>>>>>>> ad46eb8 (Tablas Angel - 12)
})