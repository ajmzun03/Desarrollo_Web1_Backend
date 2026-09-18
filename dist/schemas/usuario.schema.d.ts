import z from 'zod';
export declare const schemaUsuario: z.ZodObject<{
    usuario: z.ZodString;
    correo_electronico: z.ZodString;
    contrasenia: z.ZodString;
    rol: z.ZodEnum<{
        ADMIN: "ADMIN";
        BODEGUERO: "BODEGUERO";
        CAJERO: "CAJERO";
        DESPACHADOR: "DESPACHADOR";
        REPARTIDOR: "REPARTIDOR";
    }>;
}, z.core.$strip>;
export declare function validateUsuario(object: any): z.ZodSafeParseResult<{
    usuario: string;
    correo_electronico: string;
    contrasenia: string;
    rol: "ADMIN" | "BODEGUERO" | "CAJERO" | "DESPACHADOR" | "REPARTIDOR";
}>;
//# sourceMappingURL=usuario.schema.d.ts.map