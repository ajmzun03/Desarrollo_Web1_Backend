import z from 'zod'
import { estadoPedidoEnum, metodoPagoEnum, tipoEntregaEnum } from './db.schema.js'

const estadoPedidoValues = estadoPedidoEnum.enumValues

export const schemaPedido = z.object({
  cliente_id: z.number().int("El ID del cliente debe ser un número entero").positive("El ID del cliente debe ser un número positivo"),
  observaciones: z.string().trim().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
  estado: z.enum(estadoPedidoValues, { message: `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}` })
})

const idPositivo = (nombre: string) => z.number().int(`${nombre} debe ser un número entero`).positive(`${nombre} debe ser un número positivo`)

export const schemaItemPedido = z.object({
  producto_id: idPositivo("El ID del producto").optional(),
  combo_id: idPositivo("El ID del combo").optional(),
  cantidad: z.number().positive("La cantidad debe ser un número positivo").max(1000, "La cantidad máxima por producto es 1000"),
  extras: z.array(z.object({
    producto_extra_id: idPositivo("El ID del extra"),
    cantidad: z.number().positive("La cantidad del extra debe ser positiva").max(100).optional()
  })).max(20).optional()
}).refine(i => (i.producto_id === undefined) !== (i.combo_id === undefined), {
  message: "Cada ítem debe indicar producto_id o combo_id (solo uno)",
  path: ["producto_id"]
})

// cliente_id solo lo usa el personal (el cliente final siempre crea pedidos para sí mismo).
export const schemaPedidoCreate = z.object({
  cliente_id: idPositivo("El ID del cliente").optional(),
  observaciones: z.string().trim().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
  direccion_id: idPositivo("El ID de la dirección").optional(),
  sucursal_id: idPositivo("El ID de la sucursal").optional(),
  metodo_pago: z.enum(metodoPagoEnum.enumValues, { message: `El método de pago debe ser: ${metodoPagoEnum.enumValues.join(", ")}` }).optional(),
  tipo_entrega: z.enum(tipoEntregaEnum.enumValues, { message: `El tipo de entrega debe ser: ${tipoEntregaEnum.enumValues.join(", ")}` }).optional(),
  items: z.array(schemaItemPedido).min(1, "Debe incluir al menos un producto en el pedido").max(100, "Máximo 100 productos por pedido")
})

export const schemaPedidoEstado = z.object({
  estado: z.enum(estadoPedidoValues, { message: `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}` })
})

export function validatePedido(object: unknown) {
  return schemaPedido.safeParse(object)
}

export function validatePedidoCreate(object: unknown) {
  return schemaPedidoCreate.safeParse(object)
}

export function validatePedidoEstado(object: unknown) {
  return schemaPedidoEstado.safeParse(object)
}
