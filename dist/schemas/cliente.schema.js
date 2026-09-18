import { z } from 'zod';
export const schemaCliente = z.object({
    nombre: z.string()
        .trim()
        .min(3, "El nombre del cliente debe tener al menos 3 caracteres")
        .max(100, "El nombre del cliente no puede tener más de 100 caracteres"),
    apellido: z.string()
        .trim()
        .min(3, "El apellido del cliente debe tener al menos 3 caracteres")
        .max(100, "El apellido del cliente no puede tener más de 100 caracteres"),
    telefono: z.string()
        .regex(/^\d{8}$/, "El teléfono del cliente debe tener exactamente 8 dígitos"),
    telefono_ref: z.string()
        .regex(/^\d{8}$/, "El teléfono de referencia del cliente debe tener exactamente 8 dígitos")
}).refine((data) => data.telefono_ref !== data.telefono, {
    message: "El teléfono de referencia no puede ser igual al teléfono principal",
    path: ["telefono_ref"] // Asigna el mensaje de error directamente al campo 'telefono_ref'
});
export function validateCliente(object) {
    return schemaCliente.safeParse(object);
}
//# sourceMappingURL=cliente.schema.js.map