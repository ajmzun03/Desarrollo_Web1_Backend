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

import type { InsertSucursal, SelectSucursal, UpdateSucursal } from "./schemas/db.ts"

export interface ISucursalModel {
  getAll: () => Promise<SelectSucursal[]>
  getById: (id: number) => Promise<SelectSucursal | null>
  create: (data: InsertSucursal) => Promise<SelectSucursal>
  update: (id: number, data: UpdateSucursal) => Promise<SelectSucursal | null>
}

export type Sucursal = {
  id: number
  municipio_id: number
  sucursal: string
  direccion: string
}


