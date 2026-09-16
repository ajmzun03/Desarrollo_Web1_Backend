import z from 'zod'

export const schemaProducto = z.object({
    categoria_id: z.number()
        .int("El ID de la categoría debe ser un número entero")
        .positive("El ID de la categoría debe ser un número positivo"),
    unidad_medida_id: z.number()
        .int("El ID de la unidad de medida debe ser un número entero")
        .positive("El ID de la unidad de medida debe ser un número positivo"),
    producto: z.string()
        .trim()
        .min(2, "El nombre del producto debe tener al menos 2 caracteres")
        .max(150, "El nombre del producto no puede tener más de 150 caracteres"),
    precio: z.number()
        .positive("El precio debe ser un número positivo")
})

export const schemaProductoUpdate = schemaProducto.partial().strict()

export const schemaProductoStockMinimo = z.object({
    stock_minimo: z.number()
        .int("El stock mínimo debe ser un número entero")
        .min(0, "El stock mínimo no puede ser negativo")
})

export function validateProducto(object: unknown) {
    return schemaProducto.safeParse(object)
}

export function validateProductoUpdate(object: unknown) {
    return schemaProductoUpdate.safeParse(object)
}

export function validateProductoStockMinimo(object: unknown) {
    return schemaProductoStockMinimo.safeParse(object)
}
