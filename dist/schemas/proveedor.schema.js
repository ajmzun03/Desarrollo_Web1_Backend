import z from 'zod';
export const schemaProveedor = z.object({
    noNit: z.string()
        .min(8, "El NIT debe tener al menos 8 caracteres")
        .max(13, "El NIT no puede tener más de 13 caracteres")
        .regex(/^[0-9]+$/, "El NIT solo puede contener números"),
    proveedor: z.string()
        .min(3, "El nombre del proveedor debe tener al menos 3 caracteres")
        .max(150, "El nombre del proveedor no puede tener más de 150 caracteres"),
    direccion: z.string()
        .max(255, "La dirección no puede tener más de 255 caracteres")
        .optional(),
});
export function validateProveedor(object) {
    return schemaProveedor.safeParse(object);
}
//# sourceMappingURL=proveedor.schema.js.map