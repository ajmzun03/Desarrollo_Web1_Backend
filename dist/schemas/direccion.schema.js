import z from 'zod';
export const schemaDireccion = z.object({
    cliente_id: z.number()
        .int("El ID del cliente debe ser un número entero")
        .positive("El ID del cliente debe ser un número positivo"),
    municipio_id: z.number()
        .int("El ID del municipio debe ser un número entero")
        .positive("El ID del municipio debe ser un número positivo"),
    direccion1: z.string()
        .trim()
        .min(3, "La dirección principal debe tener al menos 3 caracteres")
        .max(155, "La dirección principal no puede tener más de 155 caracteres"),
    direccion2: z.string()
        .trim()
        .min(1, "La dirección secundaria es requerida")
        .max(100, "La dirección secundaria no puede tener más de 100 caracteres")
});
export const schemaDireccionUpdate = schemaDireccion.partial().strict();
export function validateDireccion(object) {
    return schemaDireccion.safeParse(object);
}
export function validateDireccionUpdate(object) {
    return schemaDireccionUpdate.safeParse(object);
}
//# sourceMappingURL=direccion.schema.js.map