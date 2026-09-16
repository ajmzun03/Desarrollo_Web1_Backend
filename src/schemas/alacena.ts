import z from 'zod'

const schemaAlacena = z.object({
    bodega_id: z.number()
        .int("El campo Bodega ID debe ser entero")
        .positive("El campo Bodega ID debe ser positivo"),
    alacena: z.string()
        .trim()
        .min(3, "El campo Alacena debe tener al menos 3 caracteres")
        .max(100, "El campo Alacena no puede tener más de 100 caracteres"),
})