import z from 'zod';
import { estadoPedidoEnum } from './db.schema.js';
const estadoPedidoValues = estadoPedidoEnum.enumValues;
const schemaPedido = z.object({
    cliente_id: z.number().int("El ID del cliente debe ser un número entero").positive("El ID del cliente debe ser un número positivo"),
    observaciones: z.string().trim().max(255, "Las observaciones no pueden tener más de 255 caracteres").optional(),
    estado: z.enum(estadoPedidoValues, `El estado del pedido debe ser uno de los siguientes: ${estadoPedidoValues.join(', ')}`)
});
export function validatePedido(object) {
    return schemaPedido.safeParse(object);
}
//# sourceMappingURL=pedido.schema.js.map