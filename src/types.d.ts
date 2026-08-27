import type { InsertProveedor, SelectProveedor } from "./schemas/db.ts"

export interface IProveedorModel {
 getAll: () => Promise<SelectProveedor[] | null>
 getById: (id: number) => Promise<SelectProveedor | null>
 create: (data: InsertProveedor) => Promise<SelectProveedor>
 update: (data: Partial<InsertProveedor>) => Promise<SelectProveedor | null>
}

export type Proveedor = {
  id: number
  no_nit: string | number
  proveedor: string
  direccion: string | null
}