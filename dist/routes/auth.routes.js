import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, contrasenia]
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: admin.mc
 *               contrasenia:
 *                 type: string
 *                 format: password
 *                 example: umg123
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve el token JWT :)
 *       401:
 *         description: Credenciales inválidas :(
 */
router.post('/login', async (req, res) => {
    const { usuario, contrasenia } = req.body;
    const result = await AuthController.login(usuario, contrasenia);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso :)
 */
router.post('/logout', async (_req, res) => {
    const result = await AuthController.logout();
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Obtener el usuario autenticado actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado :)
 *       401:
 *         description: Token no proporcionado, inválido o expirado :(
 */
router.get('/me', authenticate, async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const result = await AuthController.me(token);
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=auth.routes.js.map