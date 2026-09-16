import z from 'zod'

export const schemaBodega = z.object({
    sucursal_id: z.number()
        .int("El ID de la sucursal debe ser un número entero")
        .positive("El ID de la sucursal debe ser un número positivo"),
    bodega: z.string()
        .trim()
        .min(2, "La bodega debe tener al menos 2 caracteres")
        .max(100, "La bodega no puede tener más de 100 caracteres")
})

export const schemaBodegaUpdate = schemaBodega.partial().strict()

export function validateBodega(object: unknown) {
    return schemaBodega.safeParse(object)
}

export function validateBodegaUpdate(object: unknown) {
    return schemaBodegaUpdate.safeParse(object)
}
