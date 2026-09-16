import { Router } from 'express';
import { ProductoModel } from '../model/supabase/producto.model.js';
const router = Router();
// GET /productos
router.get('/', async (_req, res) => {
    try {
        const productos = await ProductoModel.getAll();
        res.json({ data: productos, error: null });
    }
    catch (error) {
        console.error('Error get productos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener productos' });
    }
});
// GET /productos/disponibilidad?sucursal_id=
router.get('/disponibilidad', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        // Por ahora retornamos todos los productos
        // En un sistema completo, filtraríamos por stock en la sucursal
        const productos = await ProductoModel.getAll();
        res.json({ data: productos, error: null });
    }
    catch (error) {
        console.error('Error get disponibilidad:', error);
        res.status(500).json({ data: null, error: 'Error al obtener disponibilidad' });
    }
});
// GET /productos/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const producto = await ProductoModel.getById(id);
        if (!producto) {
            res.status(404).json({ data: null, error: 'Producto no encontrado' });
            return;
        }
        res.json({ data: producto, error: null });
    }
    catch (error) {
        console.error('Error get producto:', error);
        res.status(500).json({ data: null, error: 'Error al obtener producto' });
    }
});
// POST /productos
router.post('/', async (_req, res) => {
    try {
        const { categoria_id, unidad_medida_id, producto, precio } = _req.body;
        if (!categoria_id || !unidad_medida_id || !producto || !precio) {
            res.status(400).json({ data: null, error: 'categoria_id, unidad_medida_id, producto y precio son requeridos' });
            return;
        }
        const nuevoProducto = await ProductoModel.create({
            categoria_id,
            unidad_medida_id,
            producto,
            precio
        });
        res.status(201).json({ data: nuevoProducto, error: null });
    }
    catch (error) {
        console.error('Error create producto:', error);
        res.status(500).json({ data: null, error: 'Error al crear producto' });
    }
});
// PATCH /productos/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const producto = await ProductoModel.update(id, data);
        if (!producto) {
            res.status(404).json({ data: null, error: 'Producto no encontrado' });
            return;
        }
        res.json({ data: producto, error: null });
    }
    catch (error) {
        console.error('Error update producto:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar producto' });
    }
});
// PATCH /productos/:id/stock-minimo
router.patch('/:id/stock-minimo', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { stock_minimo } = _req.body;
        // Por ahora solo actualizamos el producto
        // En un sistema completo, tendrías una tabla de configuración de stock mínimo por sucursal
        const producto = await ProductoModel.update(id, {});
        if (!producto) {
            res.status(404).json({ data: null, error: 'Producto no encontrado' });
            return;
        }
        res.json({ data: { ...producto, stock_minimo }, error: null });
    }
    catch (error) {
        console.error('Error update stock-minimo:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar stock mínimo' });
    }
});
export default router;
//# sourceMappingURL=productos.routes.js.map