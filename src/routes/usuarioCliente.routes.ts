import { Router, type Request, type Response } from 'express';
import { UsuarioClienteController } from '../controllers/usuarioCliente.controller.js';
import { authenticate, clienteOnly, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { crearAuthLimiter } from '../middleware/authRateLimit.js';
import {
  schemaClienteRegistro,
  schemaClienteLogin,
  schemaClienteRecuperar,
  schemaClienteRestablecer
} from '../schemas/usuarioCliente.schema.js';

const router: Router = Router();

// Limitadores separados (aciertos no consumen intentos; clave IP + correo)
// Registro: cada intento cuenta (aunque tenga éxito) para frenar la creación masiva de cuentas
const registroLimiter = crearAuthLimiter({ ventanaMinutos: 60, limite: 10, contarAciertos: true });
const loginLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });
const recuperarLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 5, porIdentificador: true });
const restablecerLimiter = crearAuthLimiter({ ventanaMinutos: 15, limite: 10, porIdentificador: true });

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
router.post('/registro', registroLimiter, validate(schemaClienteRegistro), async (req: Request, res: Response) => {
  const result = await UsuarioClienteController.registro(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/login:
 *   post:
 *     summary: Login de cliente final (correo y contraseña, sin segundo factor)
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
 *       200:
 *         description: Credenciales válidas; devuelve cliente + token (los clientes no usan segundo factor)
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginLimiter, validate(schemaClienteLogin), async (req: Request, res: Response) => {
  const { correo_electronico, contrasenia } = req.body;
  const result = await UsuarioClienteController.login(correo_electronico, contrasenia);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/recuperar:
 *   post:
 *     summary: Solicitar el correo de recuperación de contraseña
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
 *         description: Si el correo existe, Supabase envía un enlace con token_hash (respuesta genérica)
 */
router.post('/recuperar', recuperarLimiter, validate(schemaClienteRecuperar), async (req: Request, res: Response) => {
  const { correo_electronico } = req.body;
  const result = await UsuarioClienteController.recuperarContrasenia(correo_electronico);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /cliente/auth/restablecer:
 *   post:
 *     summary: Restablecer contraseña con el token_hash del enlace del correo
 *     tags: [Cliente Auth]
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
router.post('/restablecer', restablecerLimiter, validate(schemaClienteRestablecer), async (req: Request, res: Response) => {
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
router.post('/logout', authenticate, clienteOnly, async (req: AuthRequest, res: Response) => {
  const result = await UsuarioClienteController.logout(req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

router.get('/me', authenticate, clienteOnly, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1]!;
  const result = await UsuarioClienteController.me(token);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
