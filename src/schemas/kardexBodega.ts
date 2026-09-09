import z from 'zod'

const schemaKardexBodega = z.object({
    bodega_id: z.number()
        .int("El campo debe ser entero")
        .positive("El campo debe ser positivo"),
    lote_id: z.number()
        .int("El campo debe ser entero")
        .positive("El campo debe ser positivo"),
    tipo_movimiento: z.enum(['INGRESO', 'SALIDA', 'MERMA', 'VENCIMIENTO', 'TRASLADO']),
    cantidad: z.number()
        .positive("El campo debe ser positivo")
        .min(1, "El campo debe ser mayor o igual a 1"),
})

export function validateKardexBodega(object: any) {
    return schemaKardexBodega.safeParse(object)
}