import z from 'zod';

export const schemaComboDetalle = z.object({
  producto_id: z.number().int().positive('producto_id debe ser un entero positivo'),
  cantidad: z.number().positive('cantidad debe ser mayor a 0')
});

export const schemaComboCreate = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  precio: z.number().positive('El precio debe ser un número positivo'),
  imagen: z.string().url().or(z.string().min(1)).optional(),
  activo: z.boolean().optional(),
  items: z.array(schemaComboDetalle).min(1, 'El combo debe contener al menos un producto')
});

export const schemaComboUpdate = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  precio: z.number().positive().optional(),
  imagen: z.string().optional(),
  activo: z.boolean().optional(),
  items: z.array(schemaComboDetalle).optional()
});

export function validateComboCreate(object: unknown) {
  return schemaComboCreate.safeParse(object);
}

export function validateComboUpdate(object: unknown) {
  return schemaComboUpdate.safeParse(object);
}
