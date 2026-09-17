import { Router } from 'express';
import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';
const router = Router();
// GET /recetas
router.get('/', async (_req, res) => {
    try {
        const recetas = await RecetaModel.getAll();
        res.json({ data: recetas, error: null });
    }
    catch (error) {
        console.error('Error get recetas:', error);
        res.status(500).json({ data: null, error: 'Error al obtener recetas' });
    }
});
// GET /recetas/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const receta = await RecetaModel.getById(id);
        if (!receta) {
            res.status(404).json({ data: null, error: 'Receta no encontrada' });
            return;
        }
        // Obtener detalles de la receta
        const detalles = await RecetaDetalleModel.getByRecetaId(id);
        res.json({ data: { ...receta, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get receta:', error);
        res.status(500).json({ data: null, error: 'Error al obtener receta' });
    }
});
// POST /recetas
router.post('/', async (_req, res) => {
    try {
        const { producto_id, nombre, cantidad_lote, items } = _req.body;
        if (!producto_id || !nombre || !cantidad_lote) {
            res.status(400).json({ data: null, error: 'producto_id, nombre y cantidad_lote son requeridos' });
            return;
        }
        // Crear la receta
        const nuevaReceta = await RecetaModel.create({
            producto_id,
            nombre,
            cantidad_lote
        });
        // Crear los detalles de la receta (insumos)
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await RecetaDetalleModel.create({
                    receta_id: Number(nuevaReceta.id),
                    materia_prima_id: item.materia_prima_id,
                    cantidad_necesaria: item.cantidad_necesaria
                });
            }
        }
        // Obtener la receta con sus detalles
        const detalles = await RecetaDetalleModel.getByRecetaId(Number(nuevaReceta.id));
        res.status(201).json({ data: { ...nuevaReceta, detalles }, error: null });
    }
    catch (error) {
        console.error('Error create receta:', error);
        res.status(500).json({ data: null, error: 'Error al crear receta' });
    }
});
// PATCH /recetas/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const receta = await RecetaModel.update(id, data);
        if (!receta) {
            res.status(404).json({ data: null, error: 'Receta no encontrada' });
            return;
        }
        res.json({ data: receta, error: null });
    }
    catch (error) {
        console.error('Error update receta:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar receta' });
    }
});
export default router;
//# sourceMappingURL=recetas.routes.js.map