import { z } from 'zod'

const baseCliente = z.object({
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
})

const telefonosDistintos = (data: { telefono?: string | undefined; telefono_ref?: string | undefined }) =>
  !data.telefono || !data.telefono_ref || data.telefono_ref !== data.telefono

const mensajeTelefonos = {
  message: "El teléfono de referencia no puede ser igual al teléfono principal",
  path: ["telefono_ref"] // Asigna el mensaje de error directamente al campo 'telefono_ref'
}

export const schemaCliente = baseCliente.refine(telefonosDistintos, mensajeTelefonos)

// PATCH: campos opcionales, se rechazan campos desconocidos (evita mass-assignment)
export const schemaClienteUpdate = baseCliente.partial().strict().refine(telefonosDistintos, mensajeTelefonos)

export function validateCliente(object: any) {
  return schemaCliente.safeParse(object)
}