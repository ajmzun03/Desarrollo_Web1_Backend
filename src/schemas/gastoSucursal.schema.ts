import z from 'zod'

export const schemaGastoSucursal = z.object({
    sucursal_id: z.number()
        .int("El ID de la sucursal debe ser un número entero")
        .positive("El ID de la sucursal debe ser un número positivo"),
    caja_id: z.number()
        .int("El ID de la caja debe ser un número entero")
        .positive("El ID de la caja debe ser un número positivo")
        .optional(),
    usuario_id: z.number()
        .int("El ID del usuario debe ser un número entero")
        .positive("El ID del usuario debe ser un número positivo")
        .optional(),
    monto_apertura: z.number()
        .min(0, "El monto de apertura no puede ser negativo")
        .optional(),
    monto_cierre_declarado: z.number()
        .min(0, "El monto de cierre declarado no puede ser negativo")
        .optional(),
    monto_cierre_sistema: z.number()
        .min(0, "El monto de cierre del sistema no puede ser negativo")
        .optional()
})

export function validateGastoSucursal(object: unknown) {
    return schemaGastoSucursal.safeParse(object)
}
