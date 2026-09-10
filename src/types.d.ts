import type {
  InsertProveedor,
  SelectProveedor,
  SelectMunicipio,
  InsertSucursal,
  SelectSucursal,
  UpdateSucursal,
  SelectDepartamento,
  InsertDepartamento,
  SelectMateriaPrima,
  InsertMateriaPrima,
  UpdateMateriaPrima,
  SelectCategoria,
  InsertCategoria,
  UpdateCategoria,
  SelectCliente,
  InsertCliente,
  UpdateCliente,
  SelectDireccion,
  InsertDireccion,
  UpdateDireccion,
  SelectUnidadMedida,
  InsertUnidadMedida,
  UpdateUnidadMedida,
  SelectUsuario,
  InsertUsuario,
  UpdateUsuario,
  SelectPedido,
  UpdatePedido,
  InsertPedido,
  SelectStockAlacena,
} from "./schemas/db.schema.ts";

//PROVEEDOR
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

//SUCURSAL
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

//MUNICIPIO
export interface IMunicipioModel {
  getAll: () => Promise<SelectMunicipio[]>
  getById: (id: number) => Promise<SelectMunicipio | null>
}

export type Municipio = {
  id: number
  departamento_id: number
  municipio: string
}

//DEPARTAMENTO
export interface IDepartamentoModel {
  getAll: () => Promise<SelectDepartamento[]>
  getById: (id: number) => Promise<SelectDepartamento | null>
  create: (data: InsertDepartamento) => Promise<SelectDepartamento>
}
export type Departamento = {
  id: number
  departamento: string
}

//CATEGORIA

export interface ICategoriaModel {
  getAll: () => Promise<SelectCategoria[]>
  getById: (id: number) => Promise<SelectCategoria | null>
  create: (data: InsertCategoria) => Promise<SelectCategoria>
  update: (id: number, data: UpdateCategoria) => Promise<SelectCategoria | null>
}

export type Categoria = {
  id: number
  categoria_id: number
  descripcion: string
  creado_en: Date
}

//UNIDAD DE MEDIDA

export interface IUnidadMedidaModel {
  getAll: () => Promise<SelectUnidadMedida[]>
  getById: (id: number) => Promise<SelectUnidadMedida | null>
  create: (data: InsertUnidadMedida) => Promise<SelectUnidadMedida>
  update: (id: number, data: UpdateUnidadMedida) => Promise<SelectUnidadMedida | null>
}

export type UnidadMedida = {
  id: number
  unidad: string
  abreviatura: string
  creado_en: Date
}

//USUARIO
export interface IUsuarioModel {
  getAll: () => Promise<Omit<SelectUsuario, 'contrasenia'>[]>
  getById: (id: number) => Promise<Omit<SelectUsuario, 'contrasenia'> | null>
  create: (data: InsertUsuario) => Promise<SelectUsuario>
  update: (id: number, data: Partial<InsertUsuario>) => Promise<SelectUsuario | null>
}

export type Usuario = {
  id: number
  usuario: string
  correo_electronico: string
  contrasenia: string
  rol: string
  creado_en: Date
}

//CLIENTE


export interface IClienteModel {
  getAll: () => Promise<selectCliente[]>
  getById: (id: number) => Promise<selectCliente | null>
  create: (data: insertCliente) => Promise<selectCliente>
  update: (id: number, data: updateCliente) => Promise<selectCliente | null>
}

export type Cliente = {
  id: number
  nombre: string
  apellido: string
  telefono: string
  telefono_ref: string
  creado_en: Date
}

//DIRECCION

export interface IDireccionModel {
  getAll: () => Promise<selectDireccion[]>
  getById: (id: number) => Promise<selectDireccion | null>
  create: (data: insertDireccion) => Promise<selectDireccion>
  update: (id: number, data: updateDireccion) => Promise<selectDireccion | null>
}

export type Direccion = {
  id: number
  cliente_id: number
  municipio_id: number
  direccion1: string
  direccion2: string
}

//MATERIA PRIMA
export interface IMateriaPrimaModel {
  getAll: () => Promise<SelectMateriaPrima[]>
  getById: (id: number) => Promise<SelectMateriaPrima | null>
  create: (data: InsertMateriaPrima) => Promise<SelectMateriaPrima>
  update: (id: number, data: UpdateMateriaPrima) => Promise<SelectMateriaPrima | null>
}

export type MateriaPrima = {
  id: number
  categoria_id: number
  unidad_medida_id: number
  materia_prima: string
  es_perecedera: boolean
  maneja_merma: boolean
  creado_en: Date
}

export interface IPedidoModel {
  getPedidosCliente: (id: number) => Promise<SelectPedido[] | null>
  getPedidoId: (id: number) => Promise<SelectPedido | null>
  createPedido: (data: InsertPedido) => Promise<SelectPedido>
  updatePedido: (id: number, data: UpdatePedido) => Promise<SelectPedido | null>
}

export interface IStockAlacenaModel {
  getAlacenaById: (id: number, lote: number) => Promise<SelectStockAlacena | null>
}