import z from 'zod'

const schemaMunicipio = z.object({
    departamento_id: z.number()
    .int("El ID del departamento debe ser un número entero")
    .positive("El ID del departamento debe ser un número positivo"),

    municipio: z.string()
    .trim()
    .min(3, "El nombre del municipio debe tener al menos 3 caracteres")
    .max(100, "El nombre del municipio no puede tener más de 100 caracteres"),
})

export function validateMunicipio(object: any) {
    return schemaMunicipio.safeParse(object)
}