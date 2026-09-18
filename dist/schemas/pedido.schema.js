import z from 'zod';
import { estadoPedidoEnum } from './db.schema.js';
const estadoPedidoValues = estadoPedidoEnum.enumValues;
export const schemaPedido = z.object({
    cliente_id: z.number().int("El ID del cliente debe ser un número entero").positive("El ID del cliente debe ser un número positivo"),
    observaciones: z.string().trim().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
    estado: z.enum(estadoPedidoValues, { message: `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}` })
});
export const schemaPedidoCreate = z.object({
    cliente_id: z.number().int("El ID del cliente debe ser un número entero").positive("El ID del cliente debe ser un número positivo"),
    observaciones: z.string().trim().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
    items: z.array(z.object({
        producto_id: z.number().int("El ID del producto debe ser un número entero").positive("El ID del producto debe ser un número positivo"),
        cantidad: z.number().positive("La cantidad debe ser un número positivo")
    })).min(1, "Debe incluir al menos un producto en el pedido")
});
export const schemaPedidoEstado = z.object({
    estado: z.enum(estadoPedidoValues, { message: `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}` })
});
export function validatePedido(object) {
    return schemaPedido.safeParse(object);
}
export function validatePedidoCreate(object) {
    return schemaPedidoCreate.safeParse(object);
}
export function validatePedidoEstado(object) {
    return schemaPedidoEstado.safeParse(object);
}
//# sourceMappingURL=pedido.schema.js.map