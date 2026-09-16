import { Router } from 'express';
import { BodegaModel } from '../model/supabase/bodega.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
const router = Router();
// GET /bodegas
router.get('/', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        let bodegas;
        if (sucursal_id) {
            bodegas = await BodegaModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            bodegas = await BodegaModel.getAll();
        }
        res.json({ data: bodegas, error: null });
    }
    catch (error) {
        console.error('Error get bodegas:', error);
        res.status(500).json({ data: null, error: 'Error al obtener bodegas' });
    }
});
// GET /bodegas/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const bodega = await BodegaModel.getById(id);
        if (!bodega) {
            res.status(404).json({ data: null, error: 'Bodega no encontrada' });
            return;
        }
        res.json({ data: bodega, error: null });
    }
    catch (error) {
        console.error('Error get bodega:', error);
        res.status(500).json({ data: null, error: 'Error al obtener bodega' });
    }
});
// POST /bodegas
router.post('/', async (_req, res) => {
    try {
        const { sucursal_id, bodega } = _req.body;
        if (!sucursal_id || !bodega) {
            res.status(400).json({ data: null, error: 'sucursal_id y bodega son requeridos' });
            return;
        }
        const nuevaBodega = await BodegaModel.create({ sucursal_id, bodega });
        res.status(201).json({ data: nuevaBodega, error: null });
    }
    catch (error) {
        console.error('Error create bodega:', error);
        res.status(500).json({ data: null, error: 'Error al crear bodega' });
    }
});
// PATCH /bodegas/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const bodega = await BodegaModel.update(id, data);
        if (!bodega) {
            res.status(404).json({ data: null, error: 'Bodega no encontrada' });
            return;
        }
        res.json({ data: bodega, error: null });
    }
    catch (error) {
        console.error('Error update bodega:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar bodega' });
    }
});
// GET /lotes/fefo?bodega_id=&materia_prima_id=
router.get('/lotes/fefo', async (_req, res) => {
    try {
        const { bodega_id, materia_prima_id } = _req.query;
        if (!materia_prima_id) {
            res.status(400).json({ data: null, error: 'materia_prima_id es requerido' });
            return;
        }
        const lotes = await LoteMateriaPrimaModel.getFEFO(Number(bodega_id) || 0, Number(materia_prima_id));
        res.json({ data: lotes, error: null });
    }
    catch (error) {
        console.error('Error get lotes FEFO:', error);
        res.status(500).json({ data: null, error: 'Error al obtener lotes FEFO' });
    }
});
export default router;
//# sourceMappingURL=bodegas.routes.js.map