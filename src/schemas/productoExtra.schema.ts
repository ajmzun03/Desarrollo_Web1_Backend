import z from 'zod';

export const schemaProductoExtraCreate = z.object({
  producto_id: z.number().int().positive('producto_id debe ser un entero positivo'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  precio: z.number().positive('El precio debe ser un número positivo'),
  activo: z.boolean().optional()
});

export const schemaProductoExtraUpdate = schemaProductoExtraCreate.partial().strict();

export function validateProductoExtraCreate(object: unknown) {
  return schemaProductoExtraCreate.safeParse(object);
}

export function validateProductoExtraUpdate(object: unknown) {
  return schemaProductoExtraUpdate.safeParse(object);
}
