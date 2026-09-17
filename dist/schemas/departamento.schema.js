import z from 'zod';
const schemaDepartamento = z.object({
    departamento: z.string()
        .trim()
        .min(3, "El nombre del departamento debe tener al menos 3 caracteres")
        .max(100, "El nombre del departamento no puede tener más de 100 caracteres"),
});
export function validateDepartamento(object) {
    return schemaDepartamento.safeParse(object);
}
//# sourceMappingURL=departamento.schema.js.map