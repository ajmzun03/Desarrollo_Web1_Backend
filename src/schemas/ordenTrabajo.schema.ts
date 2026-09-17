import z from 'zod'
import { estadoOrdenTrabajoEnum } from './db.schema.js'

const estadoOrdenTrabajoValues = estadoOrdenTrabajoEnum.enumValues

export const schemaOrdenTrabajo = z.object({
    sucursal_id: z.number()
        .int("El ID de la sucursal debe ser un número entero")
        .positive("El ID de la sucursal debe ser un número positivo"),
    receta_id: z.number()
        .int("El ID de la receta debe ser un número entero")
        .positive("El ID de la receta debe ser un número positivo"),
    cantidad_produccion: z.number()
        .positive("La cantidad de producción debe ser un número positivo")
})

export const schemaOrdenTrabajoEstado = z.object({
    estado: z.enum(estadoOrdenTrabajoValues, { message: `El estado debe ser uno de los siguientes: ${estadoOrdenTrabajoValues.join(', ')}` })
})

export function validateOrdenTrabajo(object: unknown) {
    return schemaOrdenTrabajo.safeParse(object)
}

export function validateOrdenTrabajoEstado(object: unknown) {
    return schemaOrdenTrabajoEstado.safeParse(object)
}
