import z from 'zod';
export const schemaCategoria = z.object({
    categoria_id: z.number()
        .int("El ID de la categoría debe ser un número entero")
        .positive("El ID de la categoría debe ser un número positivo"),
    descripcion: z.string()
        .trim()
        .min(3, "La descripción de la categoría debe tener al menos 3 caracteres")
        .max(100, "La descripción de la categoría no puede tener más de 100 caracteres"),
});
export function validateCategoria(object) {
    return schemaCategoria.safeParse(object);
}
//# sourceMappingURL=categoria.schema.js.map