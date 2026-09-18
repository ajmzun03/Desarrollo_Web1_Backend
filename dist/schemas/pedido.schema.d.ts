import z from 'zod';
export declare const schemaPedido: z.ZodObject<{
    cliente_id: z.ZodNumber;
    observaciones: z.ZodOptional<z.ZodString>;
    estado: z.ZodEnum<{
        ANULADO: "ANULADO";
        CREADO: "CREADO";
        ENTREGADO: "ENTREGADO";
        EN_RUTA: "EN_RUTA";
        LISTO: "LISTO";
    }>;
}, z.core.$strip>;
export declare const schemaPedidoCreate: z.ZodObject<{
    cliente_id: z.ZodNumber;
    observaciones: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        producto_id: z.ZodNumber;
        cantidad: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const schemaPedidoEstado: z.ZodObject<{
    estado: z.ZodEnum<{
        ANULADO: "ANULADO";
        CREADO: "CREADO";
        ENTREGADO: "ENTREGADO";
        EN_RUTA: "EN_RUTA";
        LISTO: "LISTO";
    }>;
}, z.core.$strip>;
export declare function validatePedido(object: unknown): z.ZodSafeParseResult<{
    cliente_id: number;
    observaciones?: string | undefined;
    estado: "ANULADO" | "CREADO" | "ENTREGADO" | "EN_RUTA" | "LISTO";
}>;
export declare function validatePedidoCreate(object: unknown): z.ZodSafeParseResult<{
    cliente_id: number;
    observaciones?: string | undefined;
    items: {
        producto_id: number;
        cantidad: number;
    }[];
}>;
export declare function validatePedidoEstado(object: unknown): z.ZodSafeParseResult<{
    estado: "ANULADO" | "CREADO" | "ENTREGADO" | "EN_RUTA" | "LISTO";
}>;
//# sourceMappingURL=pedido.schema.d.ts.map