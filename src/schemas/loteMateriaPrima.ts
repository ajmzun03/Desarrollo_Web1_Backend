import z from 'zod';

const schemaLoteMateriaPrima = z.object({
  materia_prima_id: z.number()
    .int("El ID de la materia prima debe ser un número entero")
    .positive("El ID de la materia prima debe ser un número positivo"),
  
  fecha_vencimiento: z.string({ error: "La fecha de vencimiento es requerida" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida" })
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Limpia la hora actual para comparar solo fechas
      const inputDate = new Date(val);
      return inputDate >= today;
    }, {
      message: "La fecha de vencimiento no debe ser una fecha pasada"
    }),

  cantidad_inicial: z.number().positive("La cantidad inicial debe ser un número positivo"),
  
  cantidad_actual: z.number().nonnegative("La cantidad actual no puede ser negativa"),
  
  estado: z.enum(['VIGENTE', 'VENCIDO', 'AGOTADO'], {
    error: "El estado debe ser 'VIGENTE', 'VENCIDO' o 'AGOTADO'"
  }),
}).refine((data) => data.cantidad_actual <= data.cantidad_inicial, {
  message: "La cantidad actual no puede ser mayor a la cantidad inicial",
  path: ["cantidad_actual"], // Apunta el error al campo específico
});

export function validateLoteMateriaPrima(object: any) {
  return schemaLoteMateriaPrima.safeParse(object);
}