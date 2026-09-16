import { Router } from 'express';
import { ProveedorModel } from '../model/supabase/proveedor.model.js';
const router = Router();
// GET /proveedores
router.get('/', async (_req, res) => {
    try {
        const proveedores = await ProveedorModel.getAll();
        res.json({ data: proveedores, error: null });
    }
    catch (error) {
        console.error('Error get proveedores:', error);
        res.status(500).json({ data: null, error: 'Error al obtener proveedores' });
    }
});
// GET /proveedores/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const proveedor = await ProveedorModel.getById(id);
        if (!proveedor) {
            res.status(404).json({ data: null, error: 'Proveedor no encontrado' });
            return;
        }
        res.json({ data: proveedor, error: null });
    }
    catch (error) {
        console.error('Error get proveedor:', error);
        res.status(500).json({ data: null, error: 'Error al obtener proveedor' });
    }
});
// POST /proveedores
router.post('/', async (_req, res) => {
    try {
        const { no_nit, proveedor, direccion } = _req.body;
        if (!no_nit || !proveedor) {
            res.status(400).json({ data: null, error: 'no_nit y proveedor son requeridos' });
            return;
        }
        const nuevoProveedor = await ProveedorModel.create({ no_nit, proveedor, direccion });
        res.status(201).json({ data: nuevoProveedor, error: null });
    }
    catch (error) {
        console.error('Error create proveedor:', error);
        res.status(500).json({ data: null, error: 'Error al crear proveedor' });
    }
});
// PATCH /proveedores/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const proveedor = await ProveedorModel.update(id, data);
        if (!proveedor) {
            res.status(404).json({ data: null, error: 'Proveedor no encontrado' });
            return;
        }
        res.json({ data: proveedor, error: null });
    }
    catch (error) {
        console.error('Error update proveedor:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar proveedor' });
    }
});
// PATCH /proveedores/:id/estado - activar/desactivar
router.patch('/:id/estado', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { activo } = _req.body;
        // Por ahora solo actualizamos datos básicos
        // En un sistema real, tendrías un campo 'activo' o similar
        const proveedor = await ProveedorModel.update(id, {});
        if (!proveedor) {
            res.status(404).json({ data: null, error: 'Proveedor no encontrado' });
            return;
        }
        res.json({ data: proveedor, error: null });
    }
    catch (error) {
        console.error('Error update estado proveedor:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar estado del proveedor' });
    }
});
export default router;
//# sourceMappingURL=proveedores.routes.js.map