import z from 'zod';
export declare const schemaMateriaPrima: z.ZodObject<{
    categoria_id: z.ZodNumber;
    unidad_medida_id: z.ZodNumber;
    materia_prima: z.ZodString;
    es_perecedera: z.ZodBoolean;
    maneja_merma: z.ZodBoolean;
}, z.core.$strip>;
export declare function validateMateriaPrima(object: any): z.ZodSafeParseResult<{
    categoria_id: number;
    unidad_medida_id: number;
    materia_prima: string;
    es_perecedera: boolean;
    maneja_merma: boolean;
}>;
//# sourceMappingURL=materiaPrima.schema.d.ts.map