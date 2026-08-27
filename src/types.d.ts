export interface IProveedorModel {
 getAll: () => Promise<any[]>
 getById: (id: number) => Promise<any | null>
 create: (data: any) => Promise<any>
 update: (id: number, data: any) => Promise<any | null>
}

export type Proveedor = {
  id: number
  noNit: string | number
  proveedor: string
  direccion?: string
}