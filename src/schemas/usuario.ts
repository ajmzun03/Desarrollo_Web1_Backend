import z from 'zod'

const schemaUsuario = z.object({
    usuario: z.string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(50, "El nombre de usuario no puede tener más de 50 caracteres"),
    correo_electronico: z.string()
    .trim()
    .toLowerCase()
    .email("El correo electrónico no es válido")
    .max(255, "El correo electrónico no puede tener más de 255 caracteres"),
    contrasenia: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(50, "La contraseña no puede tener más de 50 caracteres"),
    rol: z.enum(["ADMIN", "BODEGUERO",'REPARTIDOR','CAJERO'], {
         message: "El rol debe ser 'ADMIN', 'BODEGUERO', 'REPARTIDOR' o 'CAJERO'" 
    }),
})

export function validateUsuario(object: any) {
    return schemaUsuario.safeParse(object)
}