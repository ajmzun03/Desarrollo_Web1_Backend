import z from 'zod';
export declare function validatePedido(object: any): z.ZodSafeParseResult<{
    cliente_id: number;
    observaciones?: string | undefined;
    estado: "ANULADO" | "CREADO" | "ENTREGADO" | "EN_RUTA" | "LISTO";
}>;
//# sourceMappingURL=pedido.schema.d.ts.map