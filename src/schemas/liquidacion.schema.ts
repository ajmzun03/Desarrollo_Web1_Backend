import z from 'zod'

export const schemaLiquidacion = z.object({
    turno_id: z.number()
        .int("El ID del turno debe ser un número entero")
        .positive("El ID del turno debe ser un número positivo"),
    repartidor_id: z.number()
        .int("El ID del repartidor debe ser un número entero")
        .positive("El ID del repartidor debe ser un número positivo"),
    monto_entregado_repartidor: z.number()
        .min(0, "El monto entregado al repartidor no puede ser negativo")
        .optional(),
    monto_recaudado_efectivo: z.number()
        .min(0, "El monto recaudado en efectivo no puede ser negativo")
        .optional(),
    monto_recaudado_voucher: z.number()
        .min(0, "El monto recaudado en voucher no puede ser negativo")
        .optional()
})

export function validateLiquidacion(object: unknown) {
    return schemaLiquidacion.safeParse(object)
}
