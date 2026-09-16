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
  SelectKardexAlacena,
  SelectProducto,
  InsertProducto,
  UpdateProducto,
  SelectReceta,
  InsertReceta,
  UpdateReceta,
  SelectRecetaDetalle,
  InsertRecetaDetalle,
  SelectBodega,
  InsertBodega,
  UpdateBodega,
  SelectAlacena,
  InsertAlacena,
  UpdateAlacena,
  SelectCaja,
  InsertCaja,
  UpdateCaja,
  SelectOrdenCompra,
  InsertOrdenCompra,
  UpdateOrdenCompra,
  SelectDetalleOrdenCompra,
  InsertDetalleOrdenCompra,
  SelectOrdenTrabajo,
  InsertOrdenTrabajo,
  UpdateOrdenTrabajo,
  SelectProductoLote,
  InsertProductoLote,
  UpdateProductoLote,
  SelectLoteMateriaPrima,
  InsertLoteMateriaPrima,
  UpdateLoteMateriaPrima,
  SelectKardexBodega,
  InsertKardexBodega,
  SelectStockBodega,
  InsertStockBodega,
  SelectHojaRecepcion,
  InsertHojaRecepcion,
  UpdateHojaRecepcion,
  SelectHojaRecepcionDetalle,
  InsertHojaRecepcionDetalle,
  SelectFacturaCompra,
  InsertFacturaCompra,
  SelectFacturaVenta,
  InsertFacturaVenta,
  SelectHojaDespacho,
  InsertHojaDespacho,
  SelectHojaDespachoDetalle,
  InsertHojaDespachoDetalle,
  SelectTurnoDespachador,
  InsertTurnoDespachador,
  UpdateTurnoDespachador,
  SelectGastosSucursal,
  InsertGastosSucursal,
  SelectLiquidacionRepartidor,
  InsertLiquidacionRepartidor,
  SelectDetallePedido,
  InsertDetallePedido,
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
  getByUsuario: (usuario: string) => Promise<SelectUsuario | null>
  getByRol: (rol: string) => Promise<Omit<SelectUsuario, 'contrasenia'>[]>
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
  getAll: () => Promise<SelectCliente[]>
  getById: (id: number) => Promise<SelectCliente | null>
  getByTelefono: (telefono: string) => Promise<SelectCliente | null>
  create: (data: InsertCliente) => Promise<SelectCliente>
  update: (id: number, data: UpdateCliente) => Promise<SelectCliente | null>
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
  getAll: () => Promise<SelectPedido[]>
  getByEstado: (estado: string) => Promise<SelectPedido[]>
  getPedidosCliente: (id: number) => Promise<SelectPedido[] | null>
  getPedidoId: (id: number) => Promise<SelectPedido | null>
  createPedido: (data: InsertPedido) => Promise<SelectPedido>
  updatePedido: (id: number, data: UpdatePedido) => Promise<SelectPedido | null>
}

export interface IStockAlacenaModel {
  getAll: () => Promise<SelectStockAlacena[]>
  getAlacenaById: (id: number, lote: number) => Promise<SelectStockAlacena | null>
  getByAlacenaId: (alacenaId: number) => Promise<SelectStockAlacena[]>
}

export interface IKardexAlacenaModel {
  getAll: () => Promise<SelectKardexAlacena[]>
  getKardexAlacenaById: (id: number, lote: number) => Promise<SelectKardexAlacena | null>
  getByAlacenaId: (alacenaId: number) => Promise<SelectKardexAlacena[]>
}

// ========== PRODUCTO ==========
export interface IProductoModel {
  getAll: () => Promise<SelectProducto[]>
  getById: (id: number) => Promise<SelectProducto | null>
  create: (data: InsertProducto) => Promise<SelectProducto>
  update: (id: number, data: UpdateProducto) => Promise<SelectProducto | null>
}

// ========== RECETA ==========
export interface IRecetaModel {
  getAll: () => Promise<SelectReceta[]>
  getById: (id: number) => Promise<SelectReceta | null>
  create: (data: InsertReceta) => Promise<SelectReceta>
  update: (id: number, data: UpdateReceta) => Promise<SelectReceta | null>
}

export interface IRecetaDetalleModel {
  getByRecetaId: (recetaId: number) => Promise<SelectRecetaDetalle[]>
  create: (data: InsertRecetaDetalle) => Promise<SelectRecetaDetalle>
}

// ========== BODEGA ==========
export interface IBodegaModel {
  getAll: () => Promise<SelectBodega[]>
  getById: (id: number) => Promise<SelectBodega | null>
  getBySucursalId: (sucursalId: number) => Promise<SelectBodega[]>
  create: (data: InsertBodega) => Promise<SelectBodega>
  update: (id: number, data: UpdateBodega) => Promise<SelectBodega | null>
}

// ========== ALACENA ==========
export interface IAlacenaModel {
  getAll: () => Promise<SelectAlacena[]>
  getById: (id: number) => Promise<SelectAlacena | null>
  getByBodegaId: (bodegaId: number) => Promise<SelectAlacena[]>
  create: (data: InsertAlacena) => Promise<SelectAlacena>
  update: (id: number, data: UpdateAlacena) => Promise<SelectAlacena | null>
}

// ========== CAJA ==========
export interface ICajaModel {
  getAll: () => Promise<SelectCaja[]>
  getById: (id: number) => Promise<SelectCaja | null>
  getBySucursalId: (sucursalId: number) => Promise<SelectCaja[]>
  create: (data: InsertCaja) => Promise<SelectCaja>
  update: (id: number, data: UpdateCaja) => Promise<SelectCaja | null>
}

// ========== ORDEN COMPRA ==========
export interface IOrdenCompraModel {
  getAll: () => Promise<SelectOrdenCompra[]>
  getById: (id: number) => Promise<SelectOrdenCompra | null>
  getByEstado: (estado: string) => Promise<SelectOrdenCompra[]>
  getBySucursalId: (sucursalId: number) => Promise<SelectOrdenCompra[]>
  create: (data: InsertOrdenCompra) => Promise<SelectOrdenCompra>
  update: (id: number, data: UpdateOrdenCompra) => Promise<SelectOrdenCompra | null>
}

export interface IDetalleOrdenCompraModel {
  getByOrdenCompraId: (ordenCompraId: number) => Promise<SelectDetalleOrdenCompra[]>
  create: (data: InsertDetalleOrdenCompra) => Promise<SelectDetalleOrdenCompra>
}

// ========== ORDEN TRABAJO ==========
export interface IOrdenTrabajoModel {
  getAll: () => Promise<SelectOrdenTrabajo[]>
  getById: (id: number) => Promise<SelectOrdenTrabajo | null>
  getBySucursalId: (sucursalId: number) => Promise<SelectOrdenTrabajo[]>
  getByEstado: (estado: string) => Promise<SelectOrdenTrabajo[]>
  create: (data: InsertOrdenTrabajo) => Promise<SelectOrdenTrabajo>
  update: (id: number, data: UpdateOrdenTrabajo) => Promise<SelectOrdenTrabajo | null>
}

// ========== PRODUCTO LOTE ==========
export interface IProductoLoteModel {
  getAll: () => Promise<SelectProductoLote[]>
  getById: (id: number) => Promise<SelectProductoLote | null>
  getByOrdenId: (ordenId: number) => Promise<SelectProductoLote[]>
  create: (data: InsertProductoLote) => Promise<SelectProductoLote>
  update: (id: number, data: UpdateProductoLote) => Promise<SelectProductoLote | null>
}

// ========== LOTE MATERIA PRIMA ==========
export interface ILoteMateriaPrimaModel {
  getAll: () => Promise<SelectLoteMateriaPrima[]>
  getById: (id: number) => Promise<SelectLoteMateriaPrima | null>
  getByMateriaPrimaId: (materiaPrimaId: number) => Promise<SelectLoteMateriaPrima[]>
  getByBodegaId: (bodegaId: number) => Promise<SelectLoteMateriaPrima[]>
  getFEFO: (bodegaId: number, materiaPrimaId: number) => Promise<SelectLoteMateriaPrima[]>
  create: (data: InsertLoteMateriaPrima) => Promise<SelectLoteMateriaPrima>
  update: (id: number, data: UpdateLoteMateriaPrima) => Promise<SelectLoteMateriaPrima | null>
}

// ========== KARDEX BODEGA ==========
export interface IKardexBodegaModel {
  getAll: () => Promise<SelectKardexBodega[]>
  getByBodegaId: (bodegaId: number) => Promise<SelectKardexBodega[]>
  getByLoteId: (loteId: number) => Promise<SelectKardexBodega[]>
  create: (data: InsertKardexBodega) => Promise<SelectKardexBodega>
}

// ========== STOCK BODEGA ==========
export interface IStockBodegaModel {
  getAll: () => Promise<SelectStockBodega[]>
  getByBodegaId: (bodegaId: number) => Promise<SelectStockBodega[]>
  create: (data: InsertStockBodega) => Promise<SelectStockBodega>
}

// ========== HOJA RECEPCION ==========
export interface IHojaRecepcionModel {
  getAll: () => Promise<SelectHojaRecepcion[]>
  getById: (id: number) => Promise<SelectHojaRecepcion | null>
  getBySucursalId: (sucursalId: number) => Promise<SelectHojaRecepcion[]>
  create: (data: InsertHojaRecepcion) => Promise<SelectHojaRecepcion>
  update: (id: number, data: UpdateHojaRecepcion) => Promise<SelectHojaRecepcion | null>
}

export interface IHojaRecepcionDetalleModel {
  getByHojaRecepcionId: (hojaRecepcionId: number) => Promise<SelectHojaRecepcionDetalle[]>
  create: (data: InsertHojaRecepcionDetalle) => Promise<SelectHojaRecepcionDetalle>
}

// ========== FACTURA COMPRA ==========
export interface IFacturaCompraModel {
  getAll: () => Promise<SelectFacturaCompra[]>
  getById: (id: number) => Promise<SelectFacturaCompra | null>
  getByHojaRecepcionId: (hojaRecepcionId: number) => Promise<SelectFacturaCompra[]>
  create: (data: InsertFacturaCompra) => Promise<SelectFacturaCompra>
}

// ========== FACTURA VENTA ==========
export interface IFacturaVentaModel {
  getAll: () => Promise<SelectFacturaVenta[]>
  getById: (id: number) => Promise<SelectFacturaVenta | null>
  getByPedidoId: (pedidoId: number) => Promise<SelectFacturaVenta[]>
  create: (data: InsertFacturaVenta) => Promise<SelectFacturaVenta>
}

// ========== HOJA DESPACHO ==========
export interface IHojaDespachoModel {
  getAll: () => Promise<SelectHojaDespacho[]>
  getById: (id: number) => Promise<SelectHojaDespacho | null>
  getByPedidoId: (pedidoId: number) => Promise<SelectHojaDespacho[]>
  create: (data: InsertHojaDespacho) => Promise<SelectHojaDespacho>
}

export interface IHojaDespachoDetalleModel {
  getByHojaDespachoId: (hojaDespachoId: number) => Promise<SelectHojaDespachoDetalle[]>
  create: (data: InsertHojaDespachoDetalle) => Promise<SelectHojaDespachoDetalle>
}

// ========== TURNO DESPACHADOR ==========
export interface ITurnoDespachadorModel {
  getAll: () => Promise<SelectTurnoDespachador[]>
  getById: (id: number) => Promise<SelectTurnoDespachador | null>
  getAbiertos: () => Promise<SelectTurnoDespachador[]>
  create: (data: InsertTurnoDespachador) => Promise<SelectTurnoDespachador>
  update: (id: number, data: UpdateTurnoDespachador) => Promise<SelectTurnoDespachador | null>
}

// ========== GASTOS SUCURSAL ==========
export interface IGastosSucursalModel {
  getAll: () => Promise<SelectGastosSucursal[]>
  getById: (id: number) => Promise<SelectGastosSucursal | null>
  getBySucursalId: (sucursalId: number) => Promise<SelectGastosSucursal[]>
  create: (data: InsertGastosSucursal) => Promise<SelectGastosSucursal>
}

// ========== LIQUIDACION REPARTIDOR ==========
export interface ILiquidacionRepartidorModel {
  getAll: () => Promise<SelectLiquidacionRepartidor[]>
  getById: (id: number) => Promise<SelectLiquidacionRepartidor | null>
  getByTurnoId: (turnoId: number) => Promise<SelectLiquidacionRepartidor[]>
  create: (data: InsertLiquidacionRepartidor) => Promise<SelectLiquidacionRepartidor>
}

// ========== DETALLE PEDIDO ==========
export interface IDetallePedidoModel {
  getByPedidoId: (pedidoId: number) => Promise<SelectDetallePedido[]>
  create: (data: InsertDetallePedido) => Promise<SelectDetallePedido>
}