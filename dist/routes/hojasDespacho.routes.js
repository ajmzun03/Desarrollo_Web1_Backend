import { Router } from 'express';
import { HojaDespachoModel, HojaDespachoDetalleModel } from '../model/supabase/hojaDespacho.model.js';
const router = Router();
// GET /hojas-despacho
router.get('/', async (_req, res) => {
    try {
        const hojas = await HojaDespachoModel.getAll();
        res.json({ data: hojas, error: null });
    }
    catch (error) {
        console.error('Error get hojas-despacho:', error);
        res.status(500).json({ data: null, error: 'Error al obtener hojas de despacho' });
    }
});
// GET /hojas-despacho/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const hoja = await HojaDespachoModel.getById(id);
        if (!hoja) {
            res.status(404).json({ data: null, error: 'Hoja de despacho no encontrada' });
            return;
        }
        const detalles = await HojaDespachoDetalleModel.getByHojaDespachoId(id);
        res.json({ data: { ...hoja, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get hoja-despacho:', error);
        res.status(500).json({ data: null, error: 'Error al obtener hoja de despacho' });
    }
});
// POST /hojas-despacho
router.post('/', async (_req, res) => {
    try {
        const { pedido_id, sucursal_despacho, repartidor_id, items } = _req.body;
        if (!pedido_id || !sucursal_despacho) {
            res.status(400).json({ data: null, error: 'pedido_id y sucursal_despacho son requeridos' });
            return;
        }
        const nuevaHoja = await HojaDespachoModel.create({
            pedido_id,
            sucursal_despacho,
            despachado_en: new Date().toISOString()
        });
        // Crear detalles si hay items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await HojaDespachoDetalleModel.create({
                    hoja_despacho_id: Number(nuevaHoja.id),
                    producto_lote_id: item.producto_lote_id,
                    cantidad_despachada: item.cantidad_despachada
                });
            }
        }
        const detalles = await HojaDespachoDetalleModel.getByHojaDespachoId(Number(nuevaHoja.id));
        res.status(201).json({ data: { ...nuevaHoja, detalles }, error: null });
    }
    catch (error) {
        console.error('Error create hoja-despacho:', error);
        res.status(500).json({ data: null, error: 'Error al crear hoja de despacho' });
    }
});
export default router;
//# sourceMappingURL=hojasDespacho.routes.js.map