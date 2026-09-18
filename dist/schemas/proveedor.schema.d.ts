import z from 'zod';
export declare const schemaProveedor: z.ZodObject<{
    noNit: z.ZodString;
    proveedor: z.ZodString;
    direccion: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function validateProveedor(object: any): z.ZodSafeParseResult<{
    noNit: string;
    proveedor: string;
    direccion?: string | undefined;
}>;
//# sourceMappingURL=proveedor.schema.d.ts.map