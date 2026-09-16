import { Router } from 'express';
import { PedidoModel } from '../model/supabase/pedido.model.js';
import { GastosSucursalModel } from '../model/supabase/gastosSucursal.model.js';
import { KardexBodegaModel } from '../model/supabase/kardexBodega.model.js';
import { KardexAlacenaModel } from '../model/supabase/kardexAlacena.model.js';
import { FacturaCompraModel } from '../model/supabase/facturaCompra.model.js';
import { FacturaVentaModel } from '../model/supabase/facturaVenta.model.js';
const router = Router();
// GET /reportes/utilidad-diaria?sucursal_id=&fecha=
router.get('/utilidad-diaria', async (_req, res) => {
    try {
        const { sucursal_id, fecha } = _req.query;
        // En un sistema real, esto sería una consulta agregada
        // Por ahora devolvemos datos de ejemplo
        const pedidos = await PedidoModel.getAll();
        const gastos = await GastosSucursalModel.getAll();
        res.json({
            data: {
                fecha: fecha || new Date().toISOString().split('T')[0],
                ventas: 0,
                costos: 0,
                utilidad: 0
            },
            error: null
        });
    }
    catch (error) {
        console.error('Error get utilidad-diaria:', error);
        res.status(500).json({ data: null, error: 'Error al obtener reporte de utilidad diaria' });
    }
});
// GET /reportes/gastos-operativos?desde=&hasta=&sucursal_id=
router.get('/gastos-operativos', async (_req, res) => {
    try {
        const { desde, hasta, sucursal_id } = _req.query;
        let gastos;
        if (sucursal_id) {
            gastos = await GastosSucursalModel.getBySucursalId(Number(sucursal_id));
        }
        else {
            gastos = await GastosSucursalModel.getAll();
        }
        const total = gastos.reduce((acc, g) => acc + (g.monto_cierre_declarado || 0), 0);
        res.json({
            data: {
                desde,
                hasta,
                total_gastos: total,
                detalle: gastos
            },
            error: null
        });
    }
    catch (error) {
        console.error('Error get gastos-operativos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener reporte de gastos operativos' });
    }
});
// GET /reportes/anulaciones?desde=&hasta=&sucursal_id=
router.get('/anulaciones', async (_req, res) => {
    try {
        const { desde, hasta, sucursal_id } = _req.query;
        // Pedidos anulados
        const pedidos = await PedidoModel.getByEstado('ANULADO');
        res.json({
            data: {
                desde,
                hasta,
                total_anulaciones: pedidos.length,
                detalle: pedidos
            },
            error: null
        });
    }
    catch (error) {
        console.error('Error get anulaciones:', error);
        res.status(500).json({ data: null, error: 'Error al obtener reporte de anulaciones' });
    }
});
// GET /auditoria/movimientos?tipo=&sucursal_id=&desde=&hasta=
router.get('/auditoria/movimientos', async (_req, res) => {
    try {
        const { tipo, sucursal_id, desde, hasta } = _req.query;
        // Por ahora devolvemos todos los movimientos de kardex
        const movimientos = await KardexBodegaModel.getAll();
        res.json({
            data: {
                tipo,
                desde,
                hasta,
                movimientos
            },
            error: null
        });
    }
    catch (error) {
        console.error('Error get auditoria:', error);
        res.status(500).json({ data: null, error: 'Error al obtener auditoría de movimientos' });
    }
});
// GET /repartidores/disponibles?sucursal_id=
router.get('/repartidores/disponibles', async (_req, res) => {
    try {
        const { sucursal_id } = _req.query;
        // En un sistema real, buscaríamos usuarios con rol=REPARTIDOR
        // y filtraríamos por disponibilidad
        res.json({
            data: [],
            error: null
        });
    }
    catch (error) {
        console.error('Error get repartidores:', error);
        res.status(500).json({ data: null, error: 'Error al obtener repartidores disponibles' });
    }
});
export default router;
//# sourceMappingURL=reportes.routes.js.map