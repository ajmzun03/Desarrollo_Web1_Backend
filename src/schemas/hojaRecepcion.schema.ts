import z from 'zod'
import { tipoRecepcionEnum } from './db.schema.js'

const tipoRecepcionValues = tipoRecepcionEnum.enumValues

export const schemaHojaRecepcion = z.object({
    sucursal_receptora: z.number()
        .int("El ID de la sucursal receptora debe ser un número entero")
        .positive("El ID de la sucursal receptora debe ser un número positivo"),
    orden_compra_id: z.number()
        .int("El ID de la orden de compra debe ser un número entero")
        .positive("El ID de la orden de compra debe ser un número positivo")
        .optional(),
    tipo_recepcion: z.enum(tipoRecepcionValues, { message: `El tipo de recepción debe ser uno de los siguientes: ${tipoRecepcionValues.join(', ')}` }).optional(),
    items: z.array(z.object({
        materia_prima_id: z.number()
            .int("El ID de la materia prima debe ser un número entero")
            .positive("El ID de la materia prima debe ser un número positivo"),
        cantidad_recibida: z.number()
            .positive("La cantidad recibida debe ser un número positivo"),
        fecha_vencimiento: z.string()
            .min(1, "La fecha de vencimiento es requerida"),
        merma: z.number()
            .min(0, "La merma no puede ser negativa")
            .optional()
    })).min(1, "Debe incluir al menos un ítem")
})

export function validateHojaRecepcion(object: unknown) {
    return schemaHojaRecepcion.safeParse(object)
}
