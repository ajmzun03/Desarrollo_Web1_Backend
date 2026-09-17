import { Router, type Request, type Response } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaUsuario } from '../schemas/usuario.schema.js';

const router: Router = Router();

// Todas las rutas requieren ADMIN
router.use(authenticate, requireRole('ADMIN'));

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 */
router.get('/', async (_req: Request, res: Response) => {
  const result = await UsuariosController.getAll();
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', async (req: Request, res: Response) => {
  const result = await UsuariosController.getById(Number(req.params.id));
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, correo_electronico, contrasenia, rol]
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: carlos123
 *               correo_electronico:
 *                 type: string
 *                 format: email
 *                 example: carlos@correo.com
 *               contrasenia:
 *                 type: string
 *                 format: password
 *                 example: claveSegura123
 *               rol:
 *                 type: string
 *                 description: Debe coincidir con un valor del enum de roles definido en db.schema.ts
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 */
router.post('/', validate(schemaUsuario), async (req: Request, res: Response) => {
  const result = await UsuariosController.create(req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /usuarios/{id}:
 *   patch:
 *     summary: Actualizar un usuario existente (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo_electronico:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const result = await UsuariosController.update(Number(req.params.id), req.body);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;