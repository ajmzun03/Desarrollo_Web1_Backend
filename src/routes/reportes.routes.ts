import { Router, type Request, type Response } from 'express';
import { ReportesController } from '../controllers/reportes.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /reportes/utilidad-diaria:
 *   get:
 *     summary: Reporte de utilidad diaria (ventas - costos)
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de sucursal
 *       - in: query
 *         name: fecha
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha del reporte (YYYY-MM-DD). Si no se envía, usa la fecha actual
 *     responses:
 *       200:
 *         description: Reporte de utilidad diaria
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener reporte de utilidad diaria
 */
router.get('/utilidad-diaria', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const fecha = req.query.fecha as string | undefined;
  const result = await ReportesController.getUtilidadDiaria(sucursalId, fecha);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /reportes/gastos-operativos:
 *   get:
 *     summary: Reporte de gastos operativos por rango de fechas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango (YYYY-MM-DD)
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de sucursal
 *     responses:
 *       200:
 *         description: Reporte de gastos operativos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener reporte de gastos operativos
 */
router.get('/gastos-operativos', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getGastosOperativos(desde, hasta, sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /reportes/anulaciones:
 *   get:
 *     summary: Reporte de pedidos anulados por rango de fechas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango (YYYY-MM-DD)
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de sucursal
 *     responses:
 *       200:
 *         description: Reporte de anulaciones
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener reporte de anulaciones
 */
router.get('/anulaciones', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getAnulaciones(desde, hasta, sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /reportes/auditoria/movimientos:
 *   get:
 *     summary: Auditoría de movimientos (kardex y facturas) con filtros
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: false
 *         schema:
 *           type: string
 *         description: Tipo de movimiento (ENTRADA, SALIDA, COMPRA, VENTA, etc.)
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de sucursal
 *       - in: query
 *         name: desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Auditoría de movimientos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN)
 *       500:
 *         description: Error al obtener auditoría de movimientos
 */
router.get('/auditoria/movimientos', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const tipo = req.query.tipo as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const result = await ReportesController.getAuditoriaMovimientos(tipo, sucursalId, desde, hasta);
  res.status(result.status).json({ data: result.data, error: result.error });
});

/**
 * @openapi
 * /reportes/repartidores/disponibles:
 *   get:
 *     summary: Listar repartidores disponibles
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de sucursal
 *     responses:
 *       200:
 *         description: Lista de repartidores disponibles
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: No tiene el rol requerido (ADMIN o DESPACHADOR)
 *       500:
 *         description: Error al obtener repartidores disponibles
 */
router.get('/repartidores/disponibles', authenticate, requireRole('ADMIN', 'DESPACHADOR'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getRepartidoresDisponibles(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;