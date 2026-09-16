import { Router } from 'express';
import { UnidadMedidaModel } from '../model/supabase/unidadMedida.model.js';
const router = Router();
// GET /unidades-medida
router.get('/', async (_req, res) => {
    try {
        const unidades = await UnidadMedidaModel.getAll();
        res.json({ data: unidades, error: null });
    }
    catch (error) {
        console.error('Error get unidades:', error);
        res.status(500).json({ data: null, error: 'Error al obtener unidades de medida' });
    }
});
// GET /unidades-medida/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const unidad = await UnidadMedidaModel.getById(id);
        if (!unidad) {
            res.status(404).json({ data: null, error: 'Unidad de medida no encontrada' });
            return;
        }
        res.json({ data: unidad, error: null });
    }
    catch (error) {
        console.error('Error get unidad:', error);
        res.status(500).json({ data: null, error: 'Error al obtener unidad de medida' });
    }
});
// POST /unidades-medida
router.post('/', async (_req, res) => {
    try {
        const { unidad, abreviatura } = _req.body;
        if (!unidad || !abreviatura) {
            res.status(400).json({ data: null, error: 'unidad y abreviatura son requeridos' });
            return;
        }
        const nuevaUnidad = await UnidadMedidaModel.create({ unidad, abreviatura });
        res.status(201).json({ data: nuevaUnidad, error: null });
    }
    catch (error) {
        console.error('Error create unidad:', error);
        res.status(500).json({ data: null, error: 'Error al crear unidad de medida' });
    }
});
// PATCH /unidades-medida/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const unidad = await UnidadMedidaModel.update(id, data);
        if (!unidad) {
            res.status(404).json({ data: null, error: 'Unidad de medida no encontrada' });
            return;
        }
        res.json({ data: unidad, error: null });
    }
    catch (error) {
        console.error('Error update unidad:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar unidad de medida' });
    }
});
export default router;
//# sourceMappingURL=unidadesMedida.routes.js.map