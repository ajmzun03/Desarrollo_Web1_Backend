import { Router } from 'express';
import { SucursalModel } from '../model/supabase/sucursal.model.js';
const router = Router();
// GET /sucursales
router.get('/', async (_req, res) => {
    try {
        const sucursales = await SucursalModel.getAll();
        res.json({ data: sucursales, error: null });
    }
    catch (error) {
        console.error('Error get sucursales:', error);
        res.status(500).json({ data: null, error: 'Error al obtener sucursales' });
    }
});
// GET /sucursales/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const sucursal = await SucursalModel.getById(id);
        if (!sucursal) {
            res.status(404).json({ data: null, error: 'Sucursal no encontrada' });
            return;
        }
        res.json({ data: sucursal, error: null });
    }
    catch (error) {
        console.error('Error get sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al obtener sucursal' });
    }
});
// POST /sucursales
router.post('/', async (_req, res) => {
    try {
        const { municipio_id, sucursal, direccion } = _req.body;
        if (!municipio_id || !sucursal) {
            res.status(400).json({ data: null, error: 'municipio_id y sucursal son requeridos' });
            return;
        }
        const nuevaSucursal = await SucursalModel.create({
            municipio_id,
            sucursal,
            direccion
        });
        res.status(201).json({ data: nuevaSucursal, error: null });
    }
    catch (error) {
        console.error('Error create sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al crear sucursal' });
    }
});
// PATCH /sucursales/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const sucursal = await SucursalModel.update(id, data);
        if (!sucursal) {
            res.status(404).json({ data: null, error: 'Sucursal no encontrada' });
            return;
        }
        res.json({ data: sucursal, error: null });
    }
    catch (error) {
        console.error('Error update sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar sucursal' });
    }
});
export default router;
//# sourceMappingURL=sucursales.routes.js.map