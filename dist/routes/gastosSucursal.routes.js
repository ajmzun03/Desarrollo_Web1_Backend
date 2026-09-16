import { Router } from 'express';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
const router = Router();
// GET /gastos-sucursal
router.get('/', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        let gastos;
        if (sucursal_id) {
            gastos = await GastosSucursalModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            gastos = await GastosSucursalModel.getAll();
        }
        res.json({ data: gastos, error: null });
    }
    catch (error) {
        console.error('Error get gastos-sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al obtener gastos de sucursal' });
    }
});
// GET /gastos-sucursal/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const gasto = await GastosSucursalModel.getById(id);
        if (!gasto) {
            res.status(404).json({ data: null, error: 'Gasto de sucursal no encontrado' });
            return;
        }
        res.json({ data: gasto, error: null });
    }
    catch (error) {
        console.error('Error get gasto-sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al obtener gasto de sucursal' });
    }
});
// POST /gastos-sucursal
router.post('/', async (_req, res) => {
    try {
        const { caja_id, usuario_id, sucursal_id, monto_apertura, monto_cierre_declarado, monto_cierre_sistema } = _req.body;
        if (!sucursal_id) {
            res.status(400).json({ data: null, error: 'sucursal_id es requerido' });
            return;
        }
        const nuevoGasto = await GastosSucursalModel.create({
            caja_id,
            usuario_id,
            sucursal_id,
            monto_apertura,
            monto_cierre_declarado,
            monto_cierre_sistema,
            abierto_en: monto_apertura ? new Date().toISOString() : undefined,
            cerrado_en: monto_cierre_declarado ? new Date().toISOString() : undefined
        });
        res.status(201).json({ data: nuevoGasto, error: null });
    }
    catch (error) {
        console.error('Error create gasto-sucursal:', error);
        res.status(500).json({ data: null, error: 'Error al crear gasto de sucursal' });
    }
});
export default router;
//# sourceMappingURL=gastosSucursal.routes.js.map