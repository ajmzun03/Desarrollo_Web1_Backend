import type { InsertProveedor, SelectProveedor } from "./schemas/db.ts"
import type { SelectMunicipio } from "./schemas/db.ts"
import type { InsertSucursal, SelectSucursal, UpdateSucursal } from "./schemas/db.ts"

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
import type { SelectDepartamento, InsertDepartamento } from "./schemas/db.ts"

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
import type { SelectCategoria, InsertCategoria, UpdateCategoria } from "./schemas/db.ts"

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
import type { SelectUnidadMedida, InsertUnidadMedida, UpdateUnidadMedida } from "./schemas/db.ts"

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
import type { SelectUsuario, InsertUsuario, UpdateUsuario } from "./schemas/db.ts"

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

import type { selectCliente, insertCliente, updateCliente } from "./schemas/db.ts"

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

import type { selectDireccion, insertDireccion, updateDireccion } from "./schemas/db.ts"

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

import type { SelectMateriaPrima, InsertMateriaPrima, UpdateMateriaPrima } from "./schemas/db.ts"

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

//LOTE MATERIA PRIMA

import type { SelectLoteMateriaPrima, UpdateLoteMateriaPrima } from "./schemas/db.ts";

export interface ILoteMateriaPrimaModel {
  getAll: () => Promise<SelectLoteMateriaPrima[]>;
  getById: (id: number) => Promise<SelectLoteMateriaPrima | null>
  update: (id: number, data: UpdateLoteMateriaPrima) => Promise<SelectLoteMateriaPrima | null>
}

export type LoteMateriaPrima = {
  id: number;
  materia_prima_id: number;
  fecha_vencimiento: string; 
  cantidad_inicial: number;
  cantidad_actual: number;
  estado: 'VIGENTE' | 'VENCIDO' | 'AGOTADO';
  creado_en: string;
};

//BODEGA

import type {SelectBodega, InsertBodega, UpdateBodega } from "./schemas/db.ts";

export interface IBodegaModel {
  getAll: () => Promise<SelectBodega[]>;
  getById: (id: number) => Promise<SelectBodega | null>
  create: (data: InsertBodega) => Promise<SelectBodega>
  update: (id: number, data: UpdateBodega) => Promise<SelectBodega | null>
}

export type Bodega = {
  id: number;
  sucursal_id: number
  bodega: string
}

//STOCK BODEGA

import type { SelectStrockBodega } from "./schemas/db.ts";

export interface IStockBodegaModel {
  getAll: () => Promise<SelectStockBodega[]>;
  getById: (id: number) => Promise<SelectStockBodega | null>
}

export type StockBodega = {
  id: number;
  bodega_id: number;
  lote_id: number;
}

//KARDEX BODEGA

import type { SelectKardezBodega } from "./schemas/db.ts";

export interface IKardexBodegaModel {
  getAll: () => Promise<SelectKardezBodega[]>;
  getById: (id: number) => Promise<SelectKardexBodega | null>
}

export type KardexBodega = {
  id: number;
  bodega_id: number;
  lote_id: number;
  tipo_movimiento: string;
  cantidad: number;
}

//ALACENA

import type { SelectAlacena, InsertAlacena, UpdateAlacena } from "./schemas/db.ts";

export interface IAlacenaModel {
  getAll: () => Promise<SelectAlacena[]>;
  getById: (id: number) => Promise<SelectAlacena | null>
  create: (data: InsertAlacena) => Promise<SelectAlacena> 
  update: (id: number, data: UpdateAlacena) => Promise<SelectAlacena | null>
}

export type Alacena ={
  id: number;
  bodega_id: number;
  alacena: string;
  creado_en: Date;
}