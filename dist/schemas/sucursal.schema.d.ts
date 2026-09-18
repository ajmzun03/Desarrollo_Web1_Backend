import z from 'zod';
export declare const schemaSucursal: z.ZodObject<{
    municipio_id: z.ZodNumber;
    sucursal: z.ZodString;
    direccion: z.ZodString;
}, z.core.$strip>;
export declare function validateSucursal(object: any): z.ZodSafeParseResult<{
    municipio_id: number;
    sucursal: string;
    direccion: string;
}>;
//# sourceMappingURL=sucursal.schema.d.ts.map