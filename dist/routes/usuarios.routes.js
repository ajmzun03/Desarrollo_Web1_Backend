import { Router } from 'express';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { hassPassword } from '../utils/hashPassword.js';
const router = Router();
// GET /usuarios
router.get('/', async (_req, res) => {
    try {
        const usuarios = await UsuarioModel.getAll();
        res.json({ data: usuarios, error: null });
    }
    catch (error) {
        console.error('Error get usuarios:', error);
        res.status(500).json({ data: null, error: 'Error al obtener usuarios' });
    }
});
// GET /usuarios/:id
router.get('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const usuario = await UsuarioModel.getById(id);
        if (!usuario) {
            res.status(404).json({ data: null, error: 'Usuario no encontrado' });
            return;
        }
        res.json({ data: usuario, error: null });
    }
    catch (error) {
        console.error('Error get usuario:', error);
        res.status(500).json({ data: null, error: 'Error al obtener usuario' });
    }
});
// POST /usuarios
router.post('/', async (_req, res) => {
    try {
        const { usuario, correo_electronico, contrasenia, rol } = _req.body;
        if (!usuario || !contrasenia || !rol) {
            res.status(400).json({ data: null, error: 'usuario, contrasenia y rol son requeridos' });
            return;
        }
        // Encriptar contraseña
        const hashedPassword = await hassPassword(contrasenia);
        const nuevoUsuario = await UsuarioModel.create({
            usuario,
            correo_electronico,
            contrasenia: hashedPassword,
            rol
        });
        const { contrasenia: _, ...userWithoutPassword } = nuevoUsuario;
        res.status(201).json({ data: userWithoutPassword, error: null });
    }
    catch (error) {
        console.error('Error create usuario:', error);
        res.status(500).json({ data: null, error: 'Error al crear usuario' });
    }
});
// PATCH /usuarios/:id
router.patch('/:id', async (_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { contrasenia, ...data } = _req.body;
        // Si se proporciona contraseña, encriptarla
        if (contrasenia) {
            data.contrasenia = await hassPassword(contrasenia);
        }
        const usuario = await UsuarioModel.update(id, data);
        if (!usuario) {
            res.status(404).json({ data: null, error: 'Usuario no encontrado' });
            return;
        }
        const { contrasenia: _, ...userWithoutPassword } = usuario;
        res.json({ data: userWithoutPassword, error: null });
    }
    catch (error) {
        console.error('Error update usuario:', error);
        res.status(500).json({ data: null, error: 'Error al actualizar usuario' });
    }
});
export default router;
//# sourceMappingURL=usuarios.routes.js.map