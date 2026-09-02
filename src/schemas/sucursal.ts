import z from 'zod'

const schemaSucursal = z.object({
    municipio_id: z.number().int().positive("El ID del municipio debe ser un número entero positivo"),
    sucursal: z.string()
    .min(3, "El nombre de la sucursal debe tener al menos 3 caracteres")
    .trim() // Elimina espacios en blanco al inicio y al final
    .max(150, "El nombre de la sucursal no puede tener más de 150 caracteres"),

    direccion: z.string()
    .max(255, "La dirección no puede tener más de 255 caracteres"),
})

export function validateSucursal(object: any) {
    return schemaSucursal.safeParse(object)
}