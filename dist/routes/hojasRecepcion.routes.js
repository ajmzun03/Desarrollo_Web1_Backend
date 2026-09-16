import { Router } from 'express';
import { HojaRecepcionModel, HojaRecepcionDetalleModel } from '../model/supabase/hojaRecepcion.model.js';
import { LoteMateriaPrimaModel } from '../model/supabase/loteMateriaPrima.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
const router = Router();
// GET /hojas-recepcion
router.get('/', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        let hojas;
        if (sucursal_id) {
            hojas = await HojaRecepcionModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            hojas = await HojaRecepcionModel.getAll();
        }
        res.json({ data: hojas, error: null });
    }
    catch (error) {
        console.error('Error get hojas-recepcion:', error);
        res.status(500).json({ data: null, error: 'Error al obtener hojas de recepción' });
    }
});
// GET /hojas-recepcion/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const hoja = await HojaRecepcionModel.getById(id);
        if (!hoja) {
            res.status(404).json({ data: null, error: 'Hoja de recepción no encontrada' });
            return;
        }
        const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(id);
        res.json({ data: { ...hoja, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get hoja-recepcion:', error);
        res.status(500).json({ data: null, error: 'Error al obtener hoja de recepción' });
    }
});
// POST /hojas-recepcion - Endpoint clave: registra recepción
router.post('/', async (_req, res) => {
    try {
        const { sucursal_receptora, orden_compra_id, tipo_recepcion, items } = _req.body;
        if (!sucursal_receptora || !items || !Array.isArray(items)) {
            res.status(400).json({ data: null, error: 'sucursal_receptora y items son requeridos' });
            return;
        }
        // Crear la hoja de recepción
        const nuevaHoja = await HojaRecepcionModel.create({
            sucursal_receptora,
            orden_compra_id,
            tipo_recepcion: tipo_recepcion || 'TOTAL'
        });
        // Procesar cada item
        for (const item of items) {
            // Calcular saldo (recibido - merma)
            const saldo = item.cantidad_recibida - (item.merma || 0);
            // Crear detalle de recepción
            const detalle = await HojaRecepcionDetalleModel.create({
                hoja_recepcion_id: Number(nuevaHoja.id),
                materia_prima_id: item.materia_prima_id,
                cantidad_recibida: item.cantidad_recibida,
                fecha_vencimiento: item.fecha_vencimiento,
                merma: item.merma || 0,
                saldo: saldo,
                estado: saldo > 0 ? 'COMPLETA' : 'INCOMPLETA'
            });
            // Crear lote de materia prima
            const lote = await LoteMateriaPrimaModel.create({
                materia_prima_id: item.materia_prima_id,
                fecha_vencimiento: item.fecha_vencimiento,
                cantidad_inicial: saldo,
                cantidad_actual: saldo,
                estado: 'VIGENTE'
            });
            // Crear movimiento de kardex
            await KardexBodegaModel.create({
                bodega_id: sucursal_receptora, // Asumiendo que sucursal tiene bodega
                lote_id: Number(lote.id),
                tipo_movimiento: 'INGRESO',
                cantidad: saldo
            });
        }
        const detalles = await HojaRecepcionDetalleModel.getByHojaRecepcionId(Number(nuevaHoja.id));
        res.status(201).json({ data: { ...nuevaHoja, detalles }, error: null });
    }
    catch (error) {
        console.error('Error create hoja-recepcion:', error);
        res.status(500).json({ data: null, error: 'Error al crear hoja de recepción' });
    }
});
export default router;
//# sourceMappingURL=hojasRecepcion.routes.js.map