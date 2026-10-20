import z from 'zod'

export const schemaHojaDespacho = z.object({
    pedido_id: z.number()
        .int("El ID del pedido debe ser un número entero")
        .positive("El ID del pedido debe ser un número positivo"),
    sucursal_despacho: z.number()
        .int("El ID de la sucursal de despacho debe ser un número entero")
        .positive("El ID de la sucursal de despacho debe ser un número positivo"),
    repartidor_id: z.number()
        .int("El ID del repartidor debe ser un número entero")
        .positive("El ID del repartidor debe ser un número positivo")
        .optional(),
    items: z.array(z.object({
        producto_lote_id: z.number()
            .int("El ID del lote de producto debe ser un número entero")
            .positive("El ID del lote de producto debe ser un número positivo"),
        cantidad_despachada: z.number()
            .positive("La cantidad despachada debe ser un número positivo")
    })).min(1, "Debe incluir al menos un lote a despachar").max(100)
})

export function validateHojaDespacho(object: unknown) {
    return schemaHojaDespacho.safeParse(object)
}
