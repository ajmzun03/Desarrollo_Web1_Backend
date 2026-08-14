import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const proveedorTable = pgTable('proveedor',{
  id: serial('id').primaryKey(),
  no_nit: varchar('no_nit', { length: 13 }).notNull().unique(),
  proveedor: varchar('proveedor', { length: 150 }).notNull().unique(),
  direccion: varchar('direccion', { length: 255 })
})