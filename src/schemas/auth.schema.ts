import z from 'zod'

const codigo6 = z.string().trim().regex(/^\d{6}$/, 'El código debe ser de 6 dígitos')

const contraseniaNueva = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(50, 'La contraseña no puede tener más de 50 caracteres')

export const schemaVerificarCodigo = z.object({
  tmpToken: z.string().min(1, 'tmpToken es requerido'),
  codigo: codigo6
})

export const schemaRecuperar = z.object({
  identificador: z.string().trim().min(3, 'Usuario o correo requerido').max(255)
})

export const schemaRestablecer = z.object({
  identificador: z.string().trim().min(3, 'Usuario o correo requerido').max(255),
  codigo: codigo6,
  nuevaContrasenia: contraseniaNueva
})
