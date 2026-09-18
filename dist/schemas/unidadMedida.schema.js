import z from 'zod';
export const schemaUnidadMedida = z.object({
    unidad: z.string()
        .trim()
        .min(2, "La unidad de medida debe tener al menos 2 caracteres")
        .max(50, "La unidad de medida no puede tener más de 50 caracteres"),
    abreviatura: z.string()
        .trim()
        .min(2, "La abreviatura debe tener al menos 2 caracteres")
        .max(5, "La abreviatura no puede tener más de 5 caracteres"),
});
export function validateUnidadMedida(object) {
    return schemaUnidadMedida.safeParse(object);
}
//# sourceMappingURL=unidadMedida.schema.js.map