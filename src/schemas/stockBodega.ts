import z from 'zod'

const schemaStockBodega = z.object({
    bodega_id: z.number()
        .int("El campo Bodega ID debe ser un número entero")
        .positive("El campo Bodega ID debe ser un número positivo"),
    lote_id: z.number()
        .int("El campo Lote ID debe ser un número entero")
        .positive("El campo Lote ID debe ser un número positivo"),
})

export function validateStockBodega(object: any){
    return schemaStockBodega.safeParse(object)
}