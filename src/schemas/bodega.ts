import z from 'zod'

const schemaBodega = z.object({
    sucuarsal_id: z.number()
        .int("El ID de la sucursal debe ser un número entero")
        .positive("El ID de la sucursal debe ser un número positivo"),

    bodega: z.string()
        .trim()
        .min(2, "La bodega debe tener al menos 2 caracteres")
        .max(100, "La bodega no puede tener más de 100 caracteres")
})

export function validateBodega(objetc: any) {
    return schemaBodega.safeParse(objetc)
}