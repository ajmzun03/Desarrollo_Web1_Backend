import { Router, type Request, type Response } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, staffOnly, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { crearAuthLimiter } from '../middleware/authRateLimit.js';
import { schemaVerificarCodigo, schemaRecuperar, schemaRestablecer } from '../schemas/auth.schema.js';

const router: Router = Router();

// Limitadores separados: login y verificar no comparten presupuesto.
// skipSuccessfulRequests: los aciertos no consumen intentos.
// Clave por IP + identificador: los fallos de un usuario no bloquean a otro.
const loginLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });
const verificarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 15 });
const recuperarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 5, porIdentificador: true });
const restablecerLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión (paso 1: valida contraseña y envía código 2FA)
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
 *       202:
 *         description: Contraseña válida; se envió código 2FA. Devuelve tmpToken.
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de envío de código
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { usuario, contrasenia } = req.body;
  const result = await AuthController.login(usuario, contrasenia);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/verificar:
 *   post:
 *     summary: Verificar código 2FA y obtener token de sesión (paso 2)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmpToken, codigo]
 *             properties:
 *               tmpToken:
 *                 type: string
 *               codigo:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código correcto; devuelve usuario + token de sesión
 *       401:
 *         description: Código incorrecto, expirado o token temporal inválido
 */
router.post('/verificar', verificarLimiter, validate(schemaVerificarCodigo), async (req: Request, res: Response) => {
  const { tmpToken, codigo } = req.body;
  const result = await AuthController.verificarCodigo(tmpToken, codigo);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/recuperar:
 *   post:
 *     summary: Solicitar código de recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identificador]
 *             properties:
 *               identificador:
 *                 type: string
 *                 description: Usuario o correo electrónico
 *     responses:
 *       202:
 *         description: Si el usuario existe, se envió un código (respuesta genérica)
 */
router.post('/recuperar', recuperarLimiter, validate(schemaRecuperar), async (req: Request, res: Response) => {
  const { identificador } = req.body;
  const result = await AuthController.recuperarContrasenia(identificador);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/restablecer:
 *   post:
 *     summary: Restablecer contraseña con código de recuperación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identificador, codigo, nuevaContrasenia]
 *             properties:
 *               identificador:
 *                 type: string
 *               codigo:
 *                 type: string
 *               nuevaContrasenia:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Código incorrecto o expirado
 */
router.post('/restablecer', restablecerLimiter, validate(schemaRestablecer), async (req: Request, res: Response) => {
  const result = await AuthController.restablecerContrasenia(req.body);
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
router.post('/logout', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
  const result = await AuthController.logout(req.user);
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
router.get('/me', authenticate, staffOnly, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1]!;
  const result = await AuthController.me(token);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;