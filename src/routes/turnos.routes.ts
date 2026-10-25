import { Router, type Request, type Response } from 'express';
import { TurnosController } from '../controllers/turnos.controller.js';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { schemaTurnoApertura, schemaTurnoCierre, schemaTurnoValidar } from '../schemas/turno.schema.js';
import { schemaSencillo } from '../schemas/inventario.schema.js';

const router: Router = Router();

// GET /turnos — autenticado
/**
 * @openapi
 * /turnos:
 *   get:
 *     summary: Listar todos los turnos
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de turnos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, requireRole('ADMIN', 'GERENTE', 'DESPACHADOR', 'CAJERO', 'REPARTIDOR'), async (req: AuthRequest, res: Response) => {
  const result = await TurnosController.getAll(req.user);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /turnos/pendientes-validacion — ADMIN
/**
 * @openapi
 * /turnos/pendientes-validacion:
 *   get:
 *     summary: Listar turnos cerrados pendientes de validación (solo ADMIN)
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de turnos pendientes de validación
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pendientes-validacion', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const result = await TurnosController.getPendientesValidacion();
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /turnos/:id — autenticado
/**
 * @openapi
 * /turnos/{id}:
 *   get:
 *     summary: Obtener un turno por ID
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno encontrado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, requireRole('ADMIN', 'GERENTE', 'DESPACHADOR', 'CAJERO', 'REPARTIDOR'), async (req: AuthRequest, res: Response) => {
  const result = await TurnosController.getById(Number(req.params.id), req.user);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// POST /turnos/apertura — DESPACHADOR o ADMIN
/**
 * @openapi
 * /turnos/apertura:
 *   post:
 *     summary: Abrir un turno de despachador (DESPACHADOR o ADMIN)
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [caja_id, monto_apertura]
 *             properties:
 *               caja_id:
 *                 type: integer
 *                 example: 1
 *               usuario_id:
 *                 type: integer
 *                 example: 4
 *               administrador_id:
 *                 type: integer
 *                 example: 1
 *               monto_apertura:
 *                 type: number
 *                 example: 500
 *     responses:
 *       201:
 *         description: Turno abierto
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/apertura', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaTurnoApertura), async (req: AuthRequest, res: Response) => {
  const result = await TurnosController.apertura(req.body, req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /turnos/:id/cierre — DESPACHADOR o ADMIN
/**
 * @openapi
 * /turnos/{id}/cierre:
 *   patch:
 *     summary: Cerrar un turno con el monto declarado (DESPACHADOR o ADMIN)
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno a cerrar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monto_cierre_declarado]
 *             properties:
 *               monto_cierre_declarado:
 *                 type: number
 *                 example: 1200
 *     responses:
 *       200:
 *         description: Turno cerrado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (DESPACHADOR o ADMIN)
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/cierre', authenticate, requireRole('DESPACHADOR', 'ADMIN'), validate(schemaTurnoCierre), async (req: AuthRequest, res: Response) => {
  const result = await TurnosController.cierre(Number(req.params.id), req.body.monto_cierre_declarado, req.user!);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// PATCH /turnos/:id/validar — solo ADMIN
/**
 * @openapi
 * /turnos/{id}/validar:
 *   patch:
 *     summary: Validar el cierre de un turno con el monto del sistema (solo ADMIN)
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno a validar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monto_cierre_sistema]
 *             properties:
 *               monto_cierre_sistema:
 *                 type: number
 *                 example: 1150
 *     responses:
 *       200:
 *         description: Turno validado, devuelve la diferencia
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/validar', authenticate, requireRole('ADMIN'), validate(schemaTurnoValidar), async (req: Request, res: Response) => {
  const result = await TurnosController.validar(Number(req.params.id), req.body.monto_cierre_sistema);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /turnos/{id}/sencillo:
 *   post:
 *     summary: Asignación de efectivo inicial al despachador (RF-002 Administración)
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno abierto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monto]
 *             properties:
 *               monto:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Sencillo asignado (acumulado al monto de apertura)
 *       400:
 *         description: Turno cerrado o monto inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/sencillo', authenticate, requireRole('ADMIN'), validate(schemaSencillo), async (req: Request, res: Response) => {
  const result = await TurnosController.sencillo(Number(req.params.id), req.body.monto);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;