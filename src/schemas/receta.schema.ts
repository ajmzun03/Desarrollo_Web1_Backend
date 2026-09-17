import z from 'zod'

export const schemaReceta = z.object({
    producto_id: z.number()
        .int("El ID del producto debe ser un número entero")
        .positive("El ID del producto debe ser un número positivo"),
    nombre: z.string()
        .trim()
        .min(2, "El nombre de la receta debe tener al menos 2 caracteres")
        .max(150, "El nombre de la receta no puede tener más de 150 caracteres"),
    cantidad_lote: z.number()
        .positive("La cantidad del lote debe ser un número positivo"),
    items: z.array(z.object({
        materia_prima_id: z.number()
            .int("El ID de la materia prima debe ser un número entero")
            .positive("El ID de la materia prima debe ser un número positivo"),
        cantidad_necesaria: z.number()
            .positive("La cantidad necesaria debe ser un número positivo")
    })).optional()
})

export const schemaRecetaUpdate = z.object({
    producto_id: z.number()
        .int("El ID del producto debe ser un número entero")
        .positive("El ID del producto debe ser un número positivo")
        .optional(),
    nombre: z.string()
        .trim()
        .min(2, "El nombre de la receta debe tener al menos 2 caracteres")
        .max(150, "El nombre de la receta no puede tener más de 150 caracteres")
        .optional(),
    cantidad_lote: z.number()
        .positive("La cantidad del lote debe ser un número positivo")
        .optional()
}).strict()

export function validateReceta(object: unknown) {
    return schemaReceta.safeParse(object)
}

export function validateRecetaUpdate(object: unknown) {
    return schemaRecetaUpdate.safeParse(object)
}
