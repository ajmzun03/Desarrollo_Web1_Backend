import z from 'zod';
export declare const schemaCategoria: z.ZodObject<{
    categoria_id: z.ZodNumber;
    descripcion: z.ZodString;
}, z.core.$strip>;
export declare function validateCategoria(object: unknown): z.ZodSafeParseResult<{
    categoria_id: number;
    descripcion: string;
}>;
//# sourceMappingURL=categoria.schema.d.ts.map