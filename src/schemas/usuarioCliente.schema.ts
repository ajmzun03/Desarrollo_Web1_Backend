import z from 'zod';

export const schemaClienteRegistro = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  correo_electronico: z.string().email('Correo electrónico inválido').max(255),
  telefono: z.string().trim().min(7, 'El teléfono debe tener al menos 7 dígitos').max(50),
  telefono_ref: z.string().trim().max(50).optional(),
  contrasenia: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const schemaClienteLogin = z.object({
  correo_electronico: z.string().email('Correo electrónico inválido'),
  contrasenia: z.string().min(1, 'La contraseña es requerida')
});

export function validateClienteRegistro(object: unknown) {
  return schemaClienteRegistro.safeParse(object);
}

export function validateClienteLogin(object: unknown) {
  return schemaClienteLogin.safeParse(object);
}
