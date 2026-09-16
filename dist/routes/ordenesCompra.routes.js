import { Router } from 'express';
import { OrdenCompraModel, DetalleOrdenCompraModel } from '../model/supabase/ordenCompra.model.js';
const router = Router();
// GET /ordenes-compra
router.get('/', async (_req, res) => {
    try {
        const { estado, sucursal_id } = _req.query;
        let ordenes;
        if (estado) {
            ordenes = await OrdenCompraModel.getByEstado(estado);
        }
        else if (sucursal_id) {
            ordenes = await OrdenCompraModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            ordenes = await OrdenCompraModel.getAll();
        }
        res.json({ data: ordenes, error: null });
    }
    catch (error) {
        console.error('Error get ordenes-compra:', error);
        res.status(500).json({ data: null, error: 'Error al obtener órdenes de compra' });
    }
});
// GET /ordenes-compra/programadas?bodega_id=
router.get('/programadas', async (_req, res) => {
    try {
        const { bodega_id } = _req.query;
        // Órdenes en estado EN_PROCESO (agendadas)
        const ordenes = await OrdenCompraModel.getByEstado('EN_PROCESO');
        res.json({ data: ordenes, error: null });
    }
    catch (error) {
        console.error('Error get ordenes-compra programadas:', error);
        res.status(500).json({ data: null, error: 'Error al obtener órdenes de compra programadas' });
    }
});
// GET /ordenes-compra/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenCompraModel.getById(id);
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de compra no encontrada' });
            return;
        }
        const detalles = await DetalleOrdenCompraModel.getByOrdenCompraId(id);
        res.json({ data: { ...orden, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get orden-compra:', error);
        res.status(500).json({ data: null, error: 'Error al obtener orden de compra' });
    }
});
// POST /ordenes-compra
router.post('/', async (_req, res) => {
    try {
        const { proveedor_id, sucursal_destino, items } = _req.body;
        if (!proveedor_id || !sucursal_destino || !items || !Array.isArray(items)) {
            res.status(400).json({ data: null, error: 'proveedor_id, sucursal_destino y items son requeridos' });
            return;
        }
        const nuevaOrden = await OrdenCompraModel.create({
            proveedor_id,
            sucursal_destino,
            estado_orden: 'CREADA'
        });
        // Crear detalles
        for (const item of items) {
            const subtotal = item.cantidad_solicitada * item.precio_unitario;
            await DetalleOrdenCompraModel.create({
                orden_compra_id: Number(nuevaOrden.id),
                materia_prima_id: item.materia_prima_id,
                cantidad_solicitada: item.cantidad_solicitada,
                precio_unitario: item.precio_unitario,
                subtotal
            });
        }
        const detalles = await DetalleOrdenCompraModel.getByOrdenCompraId(Number(nuevaOrden.id));
        res.status(201).json({ data: { ...nuevaOrden, detalles }, error: null });
    }
    catch (error) {
        console.error('Error create orden-compra:', error);
        res.status(500).json({ data: null, error: 'Error al crear orden de compra' });
    }
});
// PATCH /ordenes-compra/:id/agendar
router.patch('/:id/agendar', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const orden = await OrdenCompraModel.update(id, { estado_orden: 'EN_PROCESO' });
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de compra no encontrada' });
            return;
        }
        res.json({ data: orden, error: null });
    }
    catch (error) {
        console.error('Error agendar orden-compra:', error);
        res.status(500).json({ data: null, error: 'Error al agendar orden de compra' });
    }
});
// PATCH /ordenes-compra/:id/estado
router.patch('/:id/estado', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { estado } = _req.body;
        const orden = await OrdenCompraModel.update(id, { estado_orden: estado });
        if (!orden) {
            res.status(404).json({ data: null, error: 'Orden de compra no encontrada' });
            return;
        }
        res.json({ data: orden, error: null });
    }
    catch (error) {
        console.error('Error update estado orden-compra:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar estado de orden de compra' });
    }
});
export default router;
//# sourceMappingURL=ordenesCompra.routes.js.map