import { db } from '../model/supabase/db.model.js';
import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';
import type { SelectReceta, SelectRecetaDetalle } from '../schemas/db.schema.js';

export interface CrearRecetaInput {
  producto_id: number;
  nombre: string;
  cantidad_lote: number;
  items?: Array<{ materia_prima_id: number; cantidad_necesaria: number }>;
}

export async function crearReceta(input: CrearRecetaInput): Promise<SelectReceta & { detalles: SelectRecetaDetalle[] }> {
  return db.transaction(async (tx) => {
    const nuevaReceta = await RecetaModel.create({
      producto_id: input.producto_id,
      nombre: input.nombre,
      cantidad_lote: String(input.cantidad_lote)
    }, tx);

    if (input.items && Array.isArray(input.items)) {
      for (const item of input.items) {
        await RecetaDetalleModel.create({
          receta_id: Number(nuevaReceta.id),
          materia_prima_id: item.materia_prima_id,
          cantidad_necesaria: String(item.cantidad_necesaria)
        }, tx);
      }
    }

    const detalles = await RecetaDetalleModel.getByRecetaId(Number(nuevaReceta.id));
    return { ...nuevaReceta, detalles };
  });
}
