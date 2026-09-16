import { Router } from 'express';
import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';
const router = Router();
// GET /facturas-compra
router.get('/', async (_req, res) => {
    try {
        const { orden_compra_id } = _req.query;
        let facturas;
        if (orden_compra_id) {
            // Por ahora devolvemos todas
            facturas = await FacturaCompraModel.getAll();
        }
        else {
            facturas = await FacturaCompraModel.getAll();
        }
        res.json({ data: facturas, error: null });
    }
    catch (error) {
        console.error('Error get facturas-compra:', error);
        res.status(500).json({ data: null, error: 'Error al obtener facturas de compra' });
    }
});
// GET /facturas-compra/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const factura = await FacturaCompraModel.getById(id);
        if (!factura) {
            res.status(404).json({ data: null, error: 'Factura de compra no encontrada' });
            return;
        }
        res.json({ data: factura, error: null });
    }
    catch (error) {
        console.error('Error get factura-compra:', error);
        res.status(500).json({ data: null, error: 'Error al obtener factura de compra' });
    }
});
// POST /facturas-compra
router.post('/', async (_req, res) => {
    try {
        const { hoja_recepcion_id, serie, numero, fecha_emision, total } = _req.body;
        if (!hoja_recepcion_id || !serie || !numero || !fecha_emision || !total) {
            res.status(400).json({ data: null, error: 'hoja_recepcion_id, serie, numero, fecha_emision y total son requeridos' });
            return;
        }
        const nuevaFactura = await FacturaCompraModel.create({
            hoja_recepcion_id,
            serie,
            numero,
            fecha_emision,
            total
        });
        res.status(201).json({ data: nuevaFactura, error: null });
    }
    catch (error) {
        console.error('Error create factura-compra:', error);
        res.status(500).json({ data: null, error: 'Error al crear factura de compra' });
    }
});
export default router;
//# sourceMappingURL=facturasCompra.routes.js.map