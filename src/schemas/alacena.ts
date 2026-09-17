import z from 'zod'

export const schemaAlacena = z.object({
    bodega_id: z.number()
        .int("El campo Bodega ID debe ser entero")
        .positive("El campo Bodega ID debe ser positivo"),
    alacena: z.string()
        .trim()
        .min(3, "El campo Alacena debe tener al menos 3 caracteres")
        .max(100, "El campo Alacena no puede tener más de 100 caracteres"),
})

export const schemaAlacenaUpdate = schemaAlacena.partial().strict()

export function validateAlacena(object: unknown) {
    return schemaAlacena.safeParse(object)
}

export function validateAlacenaUpdate(object: unknown) {
    return schemaAlacenaUpdate.safeParse(object)
}
