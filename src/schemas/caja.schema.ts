import z from 'zod'
import { tipoCajaEnum } from './db.schema.js'

const tipoCajaValues = tipoCajaEnum.enumValues

export const schemaCaja = z.object({
    sucursal_id: z.number()
        .int("El ID de la sucursal debe ser un número entero")
        .positive("El ID de la sucursal debe ser un número positivo"),
    nombre: z.string()
        .trim()
        .min(1, "El nombre de la caja es requerido")
        .max(100, "El nombre de la caja no puede tener más de 100 caracteres"),
    tipo: z.enum(tipoCajaValues, { message: `El tipo de caja debe ser uno de los siguientes: ${tipoCajaValues.join(', ')}` }).optional()
})

export const schemaCajaUpdate = schemaCaja.partial().strict()

export function validateCaja(object: unknown) {
    return schemaCaja.safeParse(object)
}

export function validateCajaUpdate(object: unknown) {
    return schemaCajaUpdate.safeParse(object)
}
