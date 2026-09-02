import z from 'zod'
import { estadoPedidoEnum } from './db.js'

const estadoPedidoValues = estadoPedidoEnum.enumValues

const schemaPedido = z.object({
  cliente_id: z.number().int("El ID del cliente debe ser un número entero").positive("El ID del cliente debe ser un número positivo"),
  fecha_pedido: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha del pedido debe tener el formato YYYY-MM-DD"),
  observaciones: z.string().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
  estado: z.enum(estadoPedidoValues, `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}`)
})

export function validatePedido(object: any) {
  return schemaPedido.safeParse(object)
}