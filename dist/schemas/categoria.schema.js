import z from 'zod';
const schemaCategoria = z.object({
    categoria_id: z.number()
        .int()
        .positive("El ID de la categoría debe ser un número entero positivo"),
    descripcion: z.string()
        .trim()
        .min(3, "La descripción de la categoría debe tener al menos 3 caracteres")
        .max(100, "La descripción de la categoría no puede tener más de 100 caracteres"),
});
//# sourceMappingURL=categoria.schema.js.map