import { Router } from 'express';
import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
const router = Router();
// POST /auth/login
router.post('/login', async (_req, res) => {
    try {
        const { usuario, contrasenia } = _req.body;
        if (!usuario || !contrasenia) {
            res.status(400).json({ data: null, error: 'Usuario y contraseña requeridos' });
            return;
        }
        const usuarios = await UsuarioModel.getAll();
        const user = usuarios.find(u => u.usuario === usuario);
        if (!user) {
            res.status(401).json({ data: null, error: 'Credenciales inválidas' });
            return;
        }
        const isValid = await comparePassword({ input: contrasenia, hashedInput: user.contrasenia });
        if (!isValid) {
            res.status(401).json({ data: null, error: 'Credenciales inválidas' });
            return;
        }
        const token = generarToken({
            id: user.id,
            usuario: user.usuario,
            rol: user.rol
        });
        if (!token) {
            res.status(500).json({ data: null, error: 'Error al generar token' });
            return;
        }
        const { contrasenia: _, ...userWithoutPassword } = user;
        res.json({
            data: {
                usuario: userWithoutPassword,
                token
            },
            error: null
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ data: null, error: 'Error interno del servidor' });
    }
});
// POST /auth/logout
router.post('/logout', async (_req, res) => {
    // En un sistema real, invalidarías el token en Redis o DB
    res.json({ data: { message: 'Sesión cerrada exitosamente' }, error: null });
});
// GET /auth/me
router.get('/me', async (_req, res) => {
    try {
        const authHeader = _req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ data: null, error: 'Token no proporcionado' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = getInfoToToken(token);
        if (!decoded) {
            res.status(401).json({ data: null, error: 'Token inválido o expirado' });
            return;
        }
        const usuario = await UsuarioModel.getById(Number(decoded.id));
        if (!usuario) {
            res.status(404).json({ data: null, error: 'Usuario no encontrado' });
            return;
        }
        const { contrasenia: _, ...userWithoutPassword } = usuario;
        res.json({ data: userWithoutPassword, error: null });
    }
    catch (error) {
        console.error('Error en /me:', error);
        res.status(500).json({ data: null, error: 'Error interno del servidor' });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map