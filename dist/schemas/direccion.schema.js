import z from 'zod';
const schemaDireccion = z.object({
    cliente_id: z.number()
        .int("El ID del cliente debe ser un número entero")
        .positive("El ID del cliente debe ser un número positivo"),
    municipio_id: z.number()
        .int("El ID del municipio debe ser un número entero")
        .positive("El ID del municipio debe ser un número positivo"),
    direccion1: z.string()
        .trim()
        .min(3, "La dirección debe tener al menos 3 caracteres")
        .max(155, "La dirección no puede tener más de 155 caracteres"),
    direccion2: z.string()
        .trim()
        .max(100, "La dirección no puede tener más de 100 caracteres")
});
export function validateDireccion(object) {
    return schemaDireccion.safeParse(object);
}
//# sourceMappingURL=direccion.schema.js.map