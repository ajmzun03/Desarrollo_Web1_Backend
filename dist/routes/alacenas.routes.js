import { Router } from 'express';
import { AlacenaModel } from '../model/supabase/alacena.model.js';
const router = Router();
// GET /alacenas
router.get('/', async (_req, res) => {
    try {
        const { bodega_id } = _req.query;
        let alacenas;
        if (bodega_id) {
            alacenas = await AlacenaModel.getByBodegaId(Number(bodega_id));
        }
        else {
            alacenas = await AlacenaModel.getAll();
        }
        res.json({ data: alacenas, error: null });
    }
    catch (error) {
        console.error('Error get alacenas:', error);
        res.status(500).json({ data: null, error: 'Error al obtener alacenas' });
    }
});
// GET /alacenas/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const alacena = await AlacenaModel.getById(id);
        if (!alacena) {
            res.status(404).json({ data: null, error: 'Alacena no encontrada' });
            return;
        }
        res.json({ data: alacena, error: null });
    }
    catch (error) {
        console.error('Error get alacena:', error);
        res.status(500).json({ data: null, error: 'Error al obtener alacena' });
    }
});
// POST /alacenas
router.post('/', async (_req, res) => {
    try {
        const { bodega_id, alacena } = _req.body;
        if (!alacena) {
            res.status(400).json({ data: null, error: 'alacena es requerido' });
            return;
        }
        const nuevaAlacena = await AlacenaModel.create({ bodega_id, alacena });
        res.status(201).json({ data: nuevaAlacena, error: null });
    }
    catch (error) {
        console.error('Error create alacena:', error);
        res.status(500).json({ data: null, error: 'Error al crear alacena' });
    }
});
// PATCH /alacenas/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const alacena = await AlacenaModel.update(id, data);
        if (!alacena) {
            res.status(404).json({ data: null, error: 'Alacena no encontrada' });
            return;
        }
        res.json({ data: alacena, error: null });
    }
    catch (error) {
        console.error('Error update alacena:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar alacena' });
    }
});
export default router;
//# sourceMappingURL=alacenas.routes.js.map