import { Router } from 'express';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
const router = Router();
// GET /pedidos
router.get('/', async (_req, res) => {
    try {
        const { sucursal_id, estado } = _req.query;
        // Por ahora retornamos todos los pedidos
        // En un sistema completo, filtraríamos por sucursal y estado
        const pedidos = await PedidoModel.getAll();
        res.json({ data: pedidos, error: null });
    }
    catch (error) {
        console.error('Error get pedidos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener pedidos' });
    }
});
// GET /pedidos/listos?sucursal_id= - Para despachador
router.get('/listos', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        // Retornar pedidos en estado LISTO
        const pedidos = await PedidoModel.getByEstado('LISTO');
        res.json({ data: pedidos, error: null });
    }
    catch (error) {
        console.error('Error get pedidos listos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener pedidos listos' });
    }
});
// GET /pedidos/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const pedido = await PedidoModel.getPedidoId(id);
        if (!pedido) {
            res.status(404).json({ data: null, error: 'Pedido no encontrado' });
            return;
        }
        // Obtener detalles del pedido
        const detalles = await DetallePedidoModel.getByPedidoId(id);
        res.json({ data: { ...pedido, detalles }, error: null });
    }
    catch (error) {
        console.error('Error get pedido:', error);
        res.status(500).json({ data: null, error: 'Error al obtener pedido' });
    }
});
// POST /pedidos
router.post('/', async (_req, res) => {
    try {
        const { cliente_id, sucursal_id, observaciones, items } = _req.body;
        if (!cliente_id || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ data: null, error: 'cliente_id y items son requeridos' });
            return;
        }
        // Crear el pedido
        const nuevoPedido = await PedidoModel.createPedido({
            cliente_id,
            observaciones,
            estado: 'CREADO'
        });
        // Crear los detalles del pedido
        for (const item of items) {
            await DetallePedidoModel.create({
                pedido_id: Number(nuevoPedido.id),
                producto_id: item.producto_id,
                cantidad: item.cantidad
            });
        }
        // Obtener el pedido con sus detalles
        const detalles = await DetallePedidoModel.getByPedidoId(Number(nuevoPedido.id));
        res.status(201).json({ data: { ...nuevoPedido, detalles }, error: null });
    }
    catch (error) {
        console.error('Error create pedido:', error);
        res.status(500).json({ data: null, error: 'Error al crear pedido' });
    }
});
// PATCH /pedidos/:id/confirmar
router.patch('/:id/confirmar', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const pedido = await PedidoModel.updatePedido(id, { estado: 'LISTO' });
        if (!pedido) {
            res.status(404).json({ data: null, error: 'Pedido no encontrado' });
            return;
        }
        res.json({ data: pedido, error: null });
    }
    catch (error) {
        console.error('Error confirmar pedido:', error);
        res.status(500).json({ data: null, error: 'Error al confirmar pedido' });
    }
});
// PATCH /pedidos/:id/entregado - Para repartidor
router.patch('/:id/entregado', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const pedido = await PedidoModel.updatePedido(id, { estado: 'ENTREGADO' });
        if (!pedido) {
            res.status(404).json({ data: null, error: 'Pedido no encontrado' });
            return;
        }
        res.json({ data: pedido, error: null });
    }
    catch (error) {
        console.error('Error entregado pedido:', error);
        res.status(500).json({ data: null, error: 'Error al marcar pedido como entregado' });
    }
});
export default router;
//# sourceMappingURL=pedidos.routes.js.map