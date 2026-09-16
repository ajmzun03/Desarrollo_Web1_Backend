import { Router } from 'express';
import { ClienteModel } from '../model/supabase/cliente.model.js';
const router = Router();
// GET /clientes?telefono=
router.get('/', async (_req, res) => {
    try {
        const { telefono } = _req.query;
        if (telefono) {
            const cliente = await ClienteModel.getByTelefono(telefono);
            res.json({ data: cliente ? [cliente] : [], error: null });
            return;
        }
        const clientes = await ClienteModel.getAll();
        res.json({ data: clientes, error: null });
    }
    catch (error) {
        console.error('Error get clientes:', error);
        res.status(500).json({ data: null, error: 'Error al obtener clientes' });
    }
});
// GET /clientes/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const cliente = await ClienteModel.getById(id);
        if (!cliente) {
            res.status(404).json({ data: null, error: 'Cliente no encontrado' });
            return;
        }
        res.json({ data: cliente, error: null });
    }
    catch (error) {
        console.error('Error get cliente:', error);
        res.status(500).json({ data: null, error: 'Error al obtener cliente' });
    }
});
// POST /clientes
router.post('/', async (_req, res) => {
    try {
        const { nombre, apellido, telefono, telefono_ref } = _req.body;
        if (!nombre || !apellido || !telefono || !telefono_ref) {
            res.status(400).json({ data: null, error: 'nombre, apellido, telefono y telefono_ref son requeridos' });
            return;
        }
        // Verificar si el teléfono ya existe
        const existingClient = await ClienteModel.getByTelefono(telefono);
        if (existingClient) {
            res.status(400).json({ data: null, error: 'El teléfono ya está registrado' });
            return;
        }
        const nuevoCliente = await ClienteModel.create({
            nombre,
            apellido,
            telefono,
            telefono_ref
        });
        res.status(201).json({ data: nuevoCliente, error: null });
    }
    catch (error) {
        console.error('Error create cliente:', error);
        res.status(500).json({ data: null, error: 'Error al crear cliente' });
    }
});
// PATCH /clientes/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const data = _req.body;
        const cliente = await ClienteModel.update(id, data);
        if (!cliente) {
            res.status(404).json({ data: null, error: 'Cliente no encontrado' });
            return;
        }
        res.json({ data: cliente, error: null });
    }
    catch (error) {
        console.error('Error update cliente:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar cliente' });
    }
});
export default router;
//# sourceMappingURL=clientes.routes.js.map