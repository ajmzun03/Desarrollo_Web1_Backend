import z from 'zod';
import { movimientoEnum } from './db.schema.js';

// YYYY-MM-DD y no vencida: no se puede ingresar stock que ya venció
export const fechaVencimiento = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
  .refine(f => !Number.isNaN(Date.parse(f)) && f >= new Date().toISOString().slice(0, 10), 'La fecha de vencimiento no puede estar en el pasado');

const movimientoValues = movimientoEnum.enumValues.filter(v => v !== 'INGRESO');

export const schemaMerma = z.object({
  alacena_id: z.number().int().positive('alacena_id debe ser un entero positivo'),
  lote_id: z.number().int().positive('lote_id debe ser un entero positivo'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  tipo: z.enum(movimientoValues as [string, ...string[]], {
    message: 'El tipo debe ser MERMA, VENCIMIENTO, SALIDA o TRASLADO'
  }).optional()
});

export const schemaTraslado = z.object({
  bodega_origen_id: z.number().int().positive('bodega_origen_id debe ser un entero positivo'),
  bodega_destino_id: z.number().int().positive('bodega_destino_id debe ser un entero positivo'),
  lote_id: z.number().int().positive('lote_id debe ser un entero positivo'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0')
});

export const schemaTrasladoAlacena = z.object({
  bodega_id: z.number().int().positive('bodega_id debe ser un entero positivo'),
  alacena_id: z.number().int().positive('alacena_id debe ser un entero positivo'),
  lote_id: z.number().int().positive('lote_id debe ser un entero positivo'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0')
});

export const schemaIngresoVale = z.object({
  bodega_id: z.number().int().positive('bodega_id debe ser un entero positivo'),
  materia_prima_id: z.number().int().positive('materia_prima_id debe ser un entero positivo'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  fecha_vencimiento: fechaVencimiento,
  descripcion: z.string().max(255).optional(),
  gasto: z.object({
    sucursal_id: z.number().int().positive(),
    caja_id: z.number().int().positive().optional(),
    usuario_id: z.number().int().positive().optional(),
    monto: z.number().min(0, 'El monto no puede ser negativo')
  }).optional()
});

export const schemaCuadre = z.object({
  bodega_id: z.number().int().positive('bodega_id debe ser un entero positivo'),
  items: z.array(z.object({
    lote_id: z.number().int().positive('lote_id debe ser un entero positivo'),
    cantidad_fisica: z.number().min(0, 'La cantidad física no puede ser negativa')
  })).min(1, 'Debe incluir al menos un lote en el cuadre').max(500)
});

export const schemaIncidente = z.object({
  motivo: z.string().trim().min(3, 'El motivo debe tener al menos 3 caracteres').max(255),
  detalle: z.string().trim().max(255).optional()
});

export const schemaSencillo = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0')
});
