import z from 'zod';
import { estadoSolicitudInsumoEnum } from './db.schema.js';

const estadoSolicitudInsumoEnumValues = estadoSolicitudInsumoEnum.enumValues

export const schemaDetalleSolicitudInsumo = z.object({
  materia_prima_id: z.number().int().positive('materia_prima_id debe ser un entero positivo'),
  cantidad_solicitada: z.number().positive('La cantidad solicitada debe ser mayor a 0')
});

export const schemaSolicitudInsumoCreate = z.object({
  sucursal_id: z.number().int().positive('sucursal_id debe ser un entero positivo'),
  items: z.array(schemaDetalleSolicitudInsumo).min(1, 'Debe incluir al menos un insumo en la solicitud')
});

export const schemaSolicitudInsumoEstado = z.object({
  estado: z.enum(estadoSolicitudInsumoEnumValues, { message: 'Estado debe ser PENDIENTE, ENVIADA, RECIBIDA o CANCELADA' }),
  detalles_recibidos: z.array(z.object({
    id: z.number().int().positive(),
    cantidad_recibida: z.number().min(0, 'La cantidad recibida no puede ser negativa')
  })).optional()
});

export function validateSolicitudInsumoCreate(object: unknown) {
  return schemaSolicitudInsumoCreate.safeParse(object);
}

export function validateSolicitudInsumoEstado(object: unknown) {
  return schemaSolicitudInsumoEstado.safeParse(object);
}
