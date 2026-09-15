import z from 'zod';
export declare function validateMateriaPrima(object: any): z.ZodSafeParseResult<{
    categoria_id: number;
    unidad_medida_id: number;
    materia_prima: string;
    es_perecedera: boolean;
    maneja_merma: boolean;
}>;
//# sourceMappingURL=materiaPrima.schema.d.ts.map