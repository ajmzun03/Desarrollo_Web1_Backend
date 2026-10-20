import z from 'zod'
import { rolUsuarioEnum } from './db.schema.js'

const estadoRolEnum = rolUsuarioEnum.enumValues

export const schemaUsuario = z.object({
    usuario: z.string()
        .trim()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(50, "El nombre de usuario no puede tener más de 50 caracteres"),
    correo_electronico: z.string()
        .trim()
        .toLowerCase()
        .email("El correo electrónico no es válido")
        .max(255, "El correo electrónico no puede tener más de 255 caracteres"),
    // Requerido: la tabla lo exige y el 2FA envía el código a este teléfono
    telefono: z.string()
        .trim()
        .regex(/^\d{7,15}$/, "El teléfono debe tener entre 7 y 15 dígitos, sin espacios ni símbolos"),
    contrasenia: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(50, "La contraseña no puede tener más de 50 caracteres"),
    rol: z.enum(estadoRolEnum, {
        message: `El rol debe ser uno de los siguientes: ${estadoRolEnum.join(', ')}`
    }),
    // false = desactiva la cuenta (no puede iniciar sesión y sus sesiones se cierran)
    activo: z.boolean().optional(),
})

// PATCH: campos opcionales, pero se rechazan campos desconocidos (strict)
export const schemaUsuarioUpdate = schemaUsuario.partial().strict()

export function validateUsuario(object: any) {
    return schemaUsuario.safeParse(object)
}