import { Router } from 'express';
import { TurnoDespachadorModel } from '../model/supabase/turnoDespachador.model.js';
const router = Router();
// GET /turnos
router.get('/', async (_req, res) => {
    try {
        const turnos = await TurnoDespachadorModel.getAll();
        res.json({ data: turnos, error: null });
    }
    catch (error) {
        console.error('Error get turnos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener turnos' });
    }
});
// GET /turnos/pendientes-validacion?sucursal_id=
router.get('/pendientes-validacion', async (_req, res) => {
    try {
        // Turnos cerrados que no han sido validados
        const turnos = await TurnoDespachadorModel.getAll();
        const pendientes = turnos.filter(t => t.cerrado_en && !t.monto_cierre_sistema);
        res.json({ data: pendientes, error: null });
    }
    catch (error) {
        console.error('Error get turnos pendientes:', error);
        res.status(500).json({ data: null, error: 'Error al obtener turnos pendientes' });
    }
});
// GET /turnos/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const turno = await TurnoDespachadorModel.getById(id);
        if (!turno) {
            res.status(404).json({ data: null, error: 'Turno no encontrado' });
            return;
        }
        res.json({ data: turno, error: null });
    }
    catch (error) {
        console.error('Error get turno:', error);
        res.status(500).json({ data: null, error: 'Error al obtener turno' });
    }
});
// POST /turnos/apertura
router.post('/apertura', async (_req, res) => {
    try {
        const { caja_id, usuario_id, administrador_id, monto_apertura } = _req.body;
        if (!caja_id || !usuario_id || !monto_apertura) {
            res.status(400).json({ data: null, error: 'caja_id, usuario_id y monto_apertura son requeridos' });
            return;
        }
        const nuevoTurno = await TurnoDespachadorModel.create({
            caja_id,
            usuario_id,
            administrador_id,
            monto_apertura,
            abierto_en: new Date().toISOString()
        });
        res.status(201).json({ data: nuevoTurno, error: null });
    }
    catch (error) {
        console.error('Error create apertura turno:', error);
        res.status(500).json({ data: null, error: 'Error al abrir turno' });
    }
});
// PATCH /turnos/:id/cierre
router.patch('/:id/cierre', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { monto_cierre_declarado } = _req.body;
        // Por ahora, el monto_cierre_sistema sería calculado
        // En un sistema real, se calcularía basado en las ventas del turno
        const turno = await TurnoDespachadorModel.update(id, {
            monto_cierre_declarado,
            cerrado_en: new Date().toISOString()
        });
        if (!turno) {
            res.status(404).json({ data: null, error: 'Turno no encontrado' });
            return;
        }
        res.json({ data: turno, error: null });
    }
    catch (error) {
        console.error('Error cierre turno:', error);
        res.status(500).json({ data: null, error: 'Error al cerrar turno' });
    }
});
// PATCH /turnos/:id/validar
router.patch('/:id/validar', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { monto_cierre_sistema, diferencia } = _req.body;
        const turno = await TurnoDespachadorModel.update(id, {
            monto_cierre_sistema
        });
        if (!turno) {
            res.status(404).json({ data: null, error: 'Turno no encontrado' });
            return;
        }
        res.json({ data: { ...turno, diferencia }, error: null });
    }
    catch (error) {
        console.error('Error validar turno:', error);
        res.status(500).json({ data: null, error: 'Error al validar turno' });
    }
});
export default router;
//# sourceMappingURL=turnos.routes.js.map