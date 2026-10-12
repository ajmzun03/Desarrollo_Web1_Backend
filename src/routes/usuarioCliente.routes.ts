import { Router, type Request, type Response } from 'express';
import { UsuarioClienteController } from '../controllers/usuarioCliente.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaClienteRegistro, schemaClienteLogin } from '../schemas/usuarioCliente.schema.js';

const router: Router = Router();

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
 *     summary: Login de cliente final
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
 *         description: Login exitoso, devuelve cliente + token
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validate(schemaClienteLogin), async (req: Request, res: Response) => {
  const { correo_electronico, contrasenia } = req.body;
  const result = await UsuarioClienteController.login(correo_electronico, contrasenia);
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
