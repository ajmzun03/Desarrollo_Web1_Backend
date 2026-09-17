import z from 'zod'

export const schemaFacturaVenta = z.object({
    pedido_id: z.number()
        .int("El ID del pedido debe ser un número entero")
        .positive("El ID del pedido debe ser un número positivo"),
    serie: z.string()
        .trim()
        .min(1, "La serie es requerida")
        .max(15, "La serie no puede tener más de 15 caracteres"),
    numero: z.string()
        .trim()
        .min(1, "El número es requerido")
        .max(32, "El número no puede tener más de 32 caracteres"),
    fecha_emision: z.string().optional(),
    total: z.number()
        .positive("El total debe ser un número positivo")
})

export function validateFacturaVenta(object: unknown) {
    return schemaFacturaVenta.safeParse(object)
}
