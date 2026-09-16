import { Router } from 'express';
import { MateriaPrimaModel } from '../model/supabase/materiaPrima.model.js';
const router = Router();
// GET /materias-primas
router.get('/', async (_req, res) => {
    try {
        const materias = await MateriaPrimaModel.getAll();
        res.json({ data: materias, error: null });
    }
    catch (error) {
        console.error('Error get materias-primas:', error);
        res.status(500).json({ data: null, error: 'Error al obtener materias primas' });
    }
});
// GET /materias-primas/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const materia = await MateriaPrimaModel.getById(id);
        if (!materia) {
            res.status(404).json({ data: null, error: 'Materia prima no encontrada' });
            return;
        }
        res.json({ data: materia, error: null });
    }
    catch (error) {
        console.error('Error get materia:', error);
        res.status(500).json({ data: null, error: 'Error al obtener materia prima' });
    }
});
// POST /materias-primas
router.post('/', async (_req, res) => {
    try {
        const { categoria_id, unidad_medida_id, materia_prima, es_perecedera, maneja_merma } = _req.body;
        if (!categoria_id || !unidad_medida_id || !materia_prima) {
            res.status(400).json({ data: null, error: 'categoria_id, unidad_medida_id y materia_prima son requeridos' });
            return;
        }
        const nuevaMateria = await MateriaPrimaModel.create({
            categoria_id,
            unidad_medida_id,
            materia_prima,
            es_perecedera: es_perecedera ?? false,
            maneja_merma: maneja_merma ?? false
        });
        res.status(201).json({ data: nuevaMateria, error: null });
    }
    catch (error) {
        console.error('Error create materia:', error);
        res.status(500).json({ data: null, error: 'Error al crear materia prima' });
    }
});
// PATCH /materias-primas/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const materia = await MateriaPrimaModel.update(id, data);
        if (!materia) {
            res.status(404).json({ data: null, error: 'Materia prima no encontrada' });
            return;
        }
        res.json({ data: materia, error: null });
    }
    catch (error) {
        console.error('Error update materia:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar materia prima' });
    }
});
export default router;
//# sourceMappingURL=materiasPrimas.routes.js.map