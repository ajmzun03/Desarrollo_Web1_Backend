import z from 'zod'

export const schemaFacturaCompra = z.object({
    hoja_recepcion_id: z.number()
        .int("El ID de la hoja de recepción debe ser un número entero")
        .positive("El ID de la hoja de recepción debe ser un número positivo"),
    serie: z.string()
        .trim()
        .min(1, "La serie es requerida")
        .max(15, "La serie no puede tener más de 15 caracteres"),
    numero: z.string()
        .trim()
        .min(1, "El número es requerido")
        .max(32, "El número no puede tener más de 32 caracteres"),
    fecha_emision: z.string()
        .min(1, "La fecha de emisión es requerida"),
    total: z.number()
        .positive("El total debe ser un número positivo")
})

export function validateFacturaCompra(object: unknown) {
    return schemaFacturaCompra.safeParse(object)
}
