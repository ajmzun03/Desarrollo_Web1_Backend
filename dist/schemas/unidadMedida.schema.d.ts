import z from 'zod';
export declare const schemaUnidadMedida: z.ZodObject<{
    unidad: z.ZodString;
    abreviatura: z.ZodString;
}, z.core.$strip>;
export declare function validateUnidadMedida(object: any): z.ZodSafeParseResult<{
    unidad: string;
    abreviatura: string;
}>;
//# sourceMappingURL=unidadMedida.schema.d.ts.map