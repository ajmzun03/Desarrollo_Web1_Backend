import z from 'zod';
export declare function validateUsuario(object: any): z.ZodSafeParseResult<{
    usuario: string;
    correo_electronico: string;
    contrasenia: string;
    rol: "ADMIN" | "BODEGUERO" | "CAJERO" | "DESPACHADOR" | "REPARTIDOR";
}>;
//# sourceMappingURL=usuario.schema.d.ts.map