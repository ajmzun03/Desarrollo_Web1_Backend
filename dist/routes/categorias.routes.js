import { Router } from 'express';
import { CategoriaModel } from '../model/supabase/categoria.model.js';
const router = Router();
// GET /categorias
router.get('/', async (_req, res) => {
    try {
        const categorias = await CategoriaModel.getAll();
        res.json({ data: categorias, error: null });
    }
    catch (error) {
        console.error('Error get categorias:', error);
        res.status(500).json({ data: null, error: 'Error al obtener categorías' });
    }
});
// GET /categorias/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const categoria = await CategoriaModel.getById(id);
        if (!categoria) {
            res.status(404).json({ data: null, error: 'Categoría no encontrada' });
            return;
        }
        res.json({ data: categoria, error: null });
    }
    catch (error) {
        console.error('Error get categoria:', error);
        res.status(500).json({ data: null, error: 'Error al obtener categoría' });
    }
});
// POST /categorias
router.post('/', async (_req, res) => {
    try {
        const { categoria_id, descripcion } = _req.body;
        if (!categoria_id || !descripcion) {
            res.status(400).json({ data: null, error: 'categoria_id y descripcion son requeridos' });
            return;
        }
        const nuevaCategoria = await CategoriaModel.create({ categoria_id, descripcion });
        res.status(201).json({ data: nuevaCategoria, error: null });
    }
    catch (error) {
        console.error('Error create categoria:', error);
        res.status(500).json({ data: null, error: 'Error al crear categoría' });
    }
});
// PATCH /categorias/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const categoria = await CategoriaModel.update(id, data);
        if (!categoria) {
            res.status(404).json({ data: null, error: 'Categoría no encontrada' });
            return;
        }
        res.json({ data: categoria, error: null });
    }
    catch (error) {
        console.error('Error update categoria:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar categoría' });
    }
});
export default router;
//# sourceMappingURL=categorias.routes.js.map