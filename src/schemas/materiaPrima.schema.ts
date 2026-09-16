import z from 'zod'

export const schemaMateriaPrima = z.object({
    categoria_id: z.number()
        .int("El ID de la categoría debe ser un número entero")
        .positive("El ID de la categoría debe ser un número positivo"),

    unidad_medida_id: z.number()
        .int("El ID de la unidad de medida debe ser un número entero")
        .positive("El ID de la unidad de medida debe ser un número positivo"),
    materia_prima: z.string()
        .trim()
        .min(3, "El nombre de la materia prima debe tener al menos 3 caracteres")
        .max(150, "El nombre de la materia prima no puede tener más de 150 caracteres"),

    es_perecedera: z.boolean(),
    maneja_merma: z.boolean(),
})

export function validateMateriaPrima(object: any) {
    return schemaMateriaPrima.safeParse(object)
}
