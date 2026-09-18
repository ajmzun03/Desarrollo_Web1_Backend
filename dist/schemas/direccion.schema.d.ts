import z from 'zod';
export declare const schemaDireccion: z.ZodObject<{
    cliente_id: z.ZodNumber;
    municipio_id: z.ZodNumber;
    direccion1: z.ZodString;
    direccion2: z.ZodString;
}, z.core.$strip>;
export declare const schemaDireccionUpdate: z.ZodObject<{
    cliente_id: z.ZodOptional<z.ZodNumber>;
    municipio_id: z.ZodOptional<z.ZodNumber>;
    direccion1: z.ZodOptional<z.ZodString>;
    direccion2: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare function validateDireccion(object: unknown): z.ZodSafeParseResult<{
    cliente_id: number;
    municipio_id: number;
    direccion1: string;
    direccion2: string;
}>;
export declare function validateDireccionUpdate(object: unknown): z.ZodSafeParseResult<{
    cliente_id?: number | undefined;
    municipio_id?: number | undefined;
    direccion1?: string | undefined;
    direccion2?: string | undefined;
}>;
//# sourceMappingURL=direccion.schema.d.ts.map