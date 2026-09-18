import { z } from 'zod';
export declare const schemaCliente: z.ZodObject<{
    nombre: z.ZodString;
    apellido: z.ZodString;
    telefono: z.ZodString;
    telefono_ref: z.ZodString;
}, z.core.$strip>;
export declare function validateCliente(object: any): z.ZodSafeParseResult<{
    nombre: string;
    apellido: string;
    telefono: string;
    telefono_ref: string;
}>;
//# sourceMappingURL=cliente.schema.d.ts.map