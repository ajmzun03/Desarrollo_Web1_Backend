import { z } from 'zod';

export const schemaItemPago = z.object({
  nombre: z.string().min(1, 'El nombre del item es requerido'),
  cantidad: z.number().int().positive('La cantidad debe ser un entero positivo'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export const schemaTarjetaPago = z.object({
  number: z
    .string()
    .min(4, 'Número de tarjeta inválido')
    .max(19, 'Número de tarjeta inválido')
    .refine(value => /^\d+$/.test(value), 'Número de tarjeta inválido'),
  exp_month: z.number().int().min(1).max(12),
  exp_year: z.number().int().min(2020),
  cvc: z.string().min(3).max(4).optional(),
});

export const schemaPagoCreate = z
  .object({
    items: z.array(schemaItemPago).min(1, 'Debe haber al menos un item'),
    payment_method: z.string().startsWith('pm_', 'payment_method inválido').optional(),
    tarjeta: schemaTarjetaPago.optional(),
    pedido_id: z.number().int().positive().optional(),
  })
  .refine(data => !!(data.payment_method || data.tarjeta), {
    message: 'payment_method o tarjeta son requeridos',
    path: ['payment_method'],
  });