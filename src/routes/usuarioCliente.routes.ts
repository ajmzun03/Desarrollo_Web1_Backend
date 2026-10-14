import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { UsuarioClienteController } from '../controllers/usuarioCliente.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  schemaClienteRegistro,
  schemaClienteLogin,
  schemaClienteVerificar,
  schemaClienteRecuperar,
  schemaClienteRestablecer
} from '../schemas/usuarioCliente.schema.js';

const router: Router = Router();

// Rate limit estricto para login/verificación: 5 intentos por 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { data: null, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

/**
 * @openapi
 * /cliente/auth/registro:
 *   post:
 *     summary: Registro de cliente final (app móvil/web)
 *     tags: [Cliente Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, correo_electronico, telefono, contrasenia]
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo_electronico:
 *                 type: string
 *                 format: email
 *               telefono:
 *                 type: string
 *               telefono_ref:
 *                 type: string
 *               contrasenia:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Registro exitoso, devuelve cliente + token
 *       409:
 *         description: Ya existe una cuenta con este correo
 */
router.post('/registro', validate(schemaClienteRegistro), async (req: Request, res: Response) => {
  const result = await UsuarioClienteController.registro(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/login:
 *   post:
 *     summary: Login de cliente final (paso 1: valida contraseña y envía código 2FA)
 *     tags: [Cliente Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo_electronico, contrasenia]
 *             properties:
 *               correo_electronico:
 *                 type: string
 *                 format: email
 *               contrasenia:
 *                 type: string
 *                 format: password
 *     responses:
 *       202:
 *         description: Contraseña válida; se envió código 2FA. Devuelve tmpToken.
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authLimiter, validate(schemaClienteLogin), async (req: Request, res: Response) => {
  const { correo_electronico, contrasenia } = req.body;
  const result = await UsuarioClienteController.login(correo_electronico, contrasenia);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/verificar:
 *   post:
 *     summary: Verificar código 2FA y obtener token de sesión (paso 2)
 *     tags: [Cliente Auth]
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
 *     responses:
 *       200:
 *         description: Código correcto; devuelve cliente + token
 *       401:
 *         description: Código incorrecto, expirado o token temporal inválido
 */
router.post('/verificar', authLimiter, validate(schemaClienteVerificar), async (req: Request, res: Response) => {
  const { tmpToken, codigo } = req.body;
  const result = await UsuarioClienteController.verificarCodigo(tmpToken, codigo);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/recuperar:
 *   post:
 *     summary: Solicitar código de recuperación de contraseña
 *     tags: [Cliente Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo_electronico]
 *             properties:
 *               correo_electronico:
 *                 type: string
 *                 format: email
 *     responses:
 *       202:
 *         description: Si el correo existe, se envió un código (respuesta genérica)
 */
router.post('/recuperar', validate(schemaClienteRecuperar), async (req: Request, res: Response) => {
  const { correo_electronico } = req.body;
  const result = await UsuarioClienteController.recuperarContrasenia(correo_electronico);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/restablecer:
 *   post:
 *     summary: Restablecer contraseña con código de recuperación
 *     tags: [Cliente Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo_electronico, codigo, nuevaContrasenia]
 *             properties:
 *               correo_electronico:
 *                 type: string
 *                 format: email
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
router.post('/restablecer', validate(schemaClienteRestablecer), async (req: Request, res: Response) => {
  const result = await UsuarioClienteController.restablecerContrasenia(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/me:
 *   get:
 *     summary: Perfil del cliente autenticado
 *     tags: [Cliente Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del cliente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1]!;
  const result = await UsuarioClienteController.me(token);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
