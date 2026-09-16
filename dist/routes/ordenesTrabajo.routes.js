import { Router } from 'express';
import { OrdenTrabajoModel } from '../model/supabase/ordenTrabajo.model.js';
import { RecetaModel, RecetaDetalleModel } from '../model/supabase/receta.model.js';
import { ProductoLoteModel } from '../model/supabase/productoLote.model.js';
const router = Router();
// GET /ordenes-trabajo
router.get('/', async (_req, res) => {
    try {
        const { sucursal_id, estado } = _req.query;
        let ordenes;
        if (estado) {
            ordenes = await OrdenTrabajoModel.getByEstado(estado);
        }
        else if (sucursal_id) {
            ordenes = await OrdenTrabajoModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            ordenes = await OrdenTrabajoModel.getAll();
        }
        res.json({ data: ordenes, error: null });
    }
    catch (error) {
        console.error('Error get ordenes-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al obtener órdenes de trabajo' });
    }
});
// GET /ordenes-trabajo/cola?sucursal_id= - Cola para cocinero
router.get('/cola', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        // Órdenes pendientes o en proceso
        const ordenes = await OrdenTrabajoModel.getByEstado('GENERADA');
        res.json({ data: ordenes, error: null });
    }
    catch (error) {
        console.error('Error get cola ordenes-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al obtener cola de órdenes' });
    }
});
// GET /ordenes-trabajo/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenTrabajoModel.getById(id);
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de trabajo no encontrada' });
            return;
        }
        res.json({ data: orden, error: null });
    }
    catch (error) {
        console.error('Error get orden-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al obtener orden de trabajo' });
    }
});
// GET /ordenes-trabajo/:id/receta - Insumos necesarios
router.get('/:id/receta', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenTrabajoModel.getById(id);
        if (!orden || !orden.receta_id) {
            res.status(404).json({ data: null, error: 'Orden de trabajo no encontrada' });
            return;
        }
        // Obtener detalles de la receta
        const detalles = await RecetaDetalleModel.getByRecetaId(orden.receta_id);
        res.json({ data: { orden, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get receta orden:', error);
        res.status(500).json({ data: null, error: 'Error al obtener receta de la orden' });
    }
});
// POST /ordenes-trabajo
router.post('/', async (_req, res) => {
    try {
        const { sucursal_id, receta_id, cantidad_produccion } = _req.body;
        if (!sucursal_id || !receta_id || !cantidad_produccion) {
            res.status(400).json({ data: null, error: 'sucursal_id, receta_id y cantidad_produccion son requeridos' });
            return;
        }
        const nuevaOrden = await OrdenTrabajoModel.create({
            sucursal_id,
            receta_id,
            cantidad_produccion,
            estado: 'GENERADA'
        });
        res.status(201).json({ data: nuevaOrden, error: null });
    }
    catch (error) {
        console.error('Error create orden-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al crear orden de trabajo' });
    }
});
// PATCH /ordenes-trabajo/:id/estado
router.patch('/:id/estado', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { estado } = _req.body;
        const orden = await OrdenTrabajoModel.update(id, { estado });
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de trabajo no encontrada' });
            return;
        }
        res.json({ data: orden, error: null });
    }
    catch (error) {
        console.error('Error update estado orden-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar estado de orden de trabajo' });
    }
});
// PATCH /ordenes-trabajo/:id/iniciar
router.patch('/:id/iniciar', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenTrabajoModel.update(id, { estado: 'EN_PROCESO' });
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de trabajo no encontrada' });
            return;
        }
        res.json({ data: orden, error: null });
    }
    catch (error) {
        console.error('Error iniciar orden-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al iniciar orden de trabajo' });
    }
});
// PATCH /ordenes-trabajo/:id/terminar
router.patch('/:id/terminar', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenTrabajoModel.getById(id);
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de trabajo no encontrada' });
            return;
        }
        // Crear lote de producto terminado
        const lote = await ProductoLoteModel.create({
            orden_id: id,
            cantidad_inicial: orden.cantidad_produccion,
            cantidad_actual: orden.cantidad_produccion,
            estado: 'VIGENTE'
        });
        // Actualizar estado de la orden
        const ordenActualizada = await OrdenTrabajoModel.update(id, { estado: 'FINALIZADA' });
        res.json({ data: { orden: ordenActualizada, lote }, error: null });
    }
    catch (error) {
        console.error('Error terminar orden-trabajo:', error);
        res.status(500).json({ data: null, error: 'Error al terminar orden de trabajo' });
    }
});
export default router;
//# sourceMappingURL=ordenesTrabajo.routes.js.map