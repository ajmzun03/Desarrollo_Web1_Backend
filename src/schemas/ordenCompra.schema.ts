import z from 'zod'
import { estadoOrdenCompraEnum } from './db.schema.js'

const estadoOrdenCompraValues = estadoOrdenCompraEnum.enumValues

export const schemaOrdenCompra = z.object({
    proveedor_id: z.number()
        .int("El ID del proveedor debe ser un número entero")
        .positive("El ID del proveedor debe ser un número positivo"),
    sucursal_destino: z.number()
        .int("El ID de la sucursal destino debe ser un número entero")
        .positive("El ID de la sucursal destino debe ser un número positivo"),
    items: z.array(z.object({
        materia_prima_id: z.number()
            .int("El ID de la materia prima debe ser un número entero")
            .positive("El ID de la materia prima debe ser un número positivo"),
        cantidad_solicitada: z.number()
            .positive("La cantidad solicitada debe ser un número positivo"),
        precio_unitario: z.number()
            .positive("El precio unitario debe ser un número positivo")
    })).min(1, "Debe incluir al menos un ítem")
})

export const schemaOrdenCompraEstado = z.object({
    estado: z.enum(estadoOrdenCompraValues, { message: `El estado debe ser uno de los siguientes: ${estadoOrdenCompraValues.join(', ')}` })
})

export function validateOrdenCompra(object: unknown) {
    return schemaOrdenCompra.safeParse(object)
}

export function validateOrdenCompraEstado(object: unknown) {
    return schemaOrdenCompraEstado.safeParse(object)
}
