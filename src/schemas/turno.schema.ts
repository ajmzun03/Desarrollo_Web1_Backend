import z from 'zod'

export const schemaTurnoApertura = z.object({
    caja_id: z.number()
        .int("El ID de la caja debe ser un número entero")
        .positive("El ID de la caja debe ser un número positivo"),
    usuario_id: z.number()
        .int("El ID del usuario debe ser un número entero")
        .positive("El ID del usuario debe ser un número positivo"),
    administrador_id: z.number()
        .int("El ID del administrador debe ser un número entero")
        .positive("El ID del administrador debe ser un número positivo")
        .optional(),
    monto_apertura: z.number()
        .positive("El monto de apertura debe ser un número positivo")
})

export const schemaTurnoCierre = z.object({
    monto_cierre_declarado: z.number()
        .min(0, "El monto de cierre declarado no puede ser negativo")
})

export const schemaTurnoValidar = z.object({
    monto_cierre_sistema: z.number()
        .min(0, "El monto de cierre del sistema no puede ser negativo")
})

export function validateTurnoApertura(object: unknown) {
    return schemaTurnoApertura.safeParse(object)
}

export function validateTurnoCierre(object: unknown) {
    return schemaTurnoCierre.safeParse(object)
}

export function validateTurnoValidar(object: unknown) {
    return schemaTurnoValidar.safeParse(object)
}
