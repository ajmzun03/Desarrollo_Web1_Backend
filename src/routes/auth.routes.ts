import { Router, type Request, type Response } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, requireRole, staffOnly, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { crearAuthLimiter } from '../middleware/authRateLimit.js';
import { schemaVerificarCodigo, schemaMfaEnrolar, schemaRecuperar, schemaRestablecer } from '../schemas/auth.schema.js';

const router: Router = Router();

// Limitadores separados: login y verificar no comparten presupuesto.
// skipSuccessfulRequests: los aciertos no consumen intentos.
// Clave por IP + identificador: los fallos de un usuario no bloquean a otro.
const loginLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });
const verificarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 15 });
const enrolarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10 });
const recuperarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 5, porIdentificador: true });
const restablecerLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: "Iniciar sesión (paso 1: valida la contraseña y abre el segundo factor)"
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
 *         description: Contraseña válida. Devuelve requiereVerificacion, mfa ("verificar" si ya tiene autenticador, "enrolar" la primera vez) y tmpToken (10 min)
 *       409:
 *         description: El usuario no tiene correo registrado
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos
 *       503:
 *         description: Segundo factor no disponible (Supabase o Redis)
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { usuario, contrasenia } = req.body;
  const result = await AuthController.login(usuario, contrasenia);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/mfa/enrolar:
 *   post:
 *     summary: Crear el autenticador (TOTP) la primera vez y obtener el QR
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmpToken]
 *             properties:
 *               tmpToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devuelve qrCode (data URI SVG), secret (texto) y uri (otpauth)
 *       401:
 *         description: Sesión de verificación vencida
 *       409:
 *         description: El usuario ya tiene un autenticador configurado
 */
router.post('/mfa/enrolar', enrolarLimiter, validate(schemaMfaEnrolar), async (req: Request, res: Response) => {
  const result = await AuthController.enrolarMfa(req.body.tmpToken);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/verificar:
 *   post:
 *     summary: Verificar el código del autenticador y obtener el token de sesión (paso 2)
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
 *         description: Código incorrecto o sesión de verificación vencida
 *       409:
 *         description: Falta configurar el autenticador (usar /auth/mfa/enrolar)
 *       429:
 *         description: Demasiados códigos incorrectos; la sesión pendiente se destruyó
 *       503:
 *         description: Segundo factor no disponible
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
 *     summary: Solicitar el correo de recuperación de contraseña
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
 *             required: [tokenHash, nuevaContrasenia]
 *             properties:
 *               tokenHash:
 *                 type: string
 *                 description: token_hash que llega en el enlace del correo (un solo uso)
 *               nuevaContrasenia:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Enlace inválido, vencido o ya usado
 */
router.post('/restablecer', restablecerLimiter, validate(schemaRestablecer), async (req: Request, res: Response) => {
  const result = await AuthController.restablecerContrasenia(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /auth/usuarios/{id}/mfa:
 *   delete:
 *     summary: Reiniciar el autenticador de un usuario (solo ADMIN)
 *     description: Para quien perdió su teléfono. Elimina sus factores TOTP y cierra sus sesiones; en el próximo login escanea un QR nuevo.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Autenticador reiniciado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/usuarios/:id/mfa', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ data: null, error: 'ID de usuario inválido' });
    return;
  }
  const result = await AuthController.reiniciarMfaDeUsuario(id);
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