import { Router, type Request, type Response } from 'express';
import { ReportesController } from '../controllers/reportes.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router: Router = Router();

// GET /reportes/utilidad-diaria — ADMIN
router.get('/utilidad-diaria', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const fecha = req.query.fecha as string | undefined;
  const result = await ReportesController.getUtilidadDiaria(sucursalId, fecha);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /reportes/gastos-operativos — ADMIN
router.get('/gastos-operativos', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getGastosOperativos(desde, hasta, sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /reportes/anulaciones — ADMIN
router.get('/anulaciones', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getAnulaciones(desde, hasta, sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /reportes/auditoria-movimientos — ADMIN
router.get('/auditoria/movimientos', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const tipo = req.query.tipo as string | undefined;
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const result = await ReportesController.getAuditoriaMovimientos(tipo, sucursalId, desde, hasta);
  res.status(result.status).json({ data: result.data, error: result.error });
});

// GET /repartidores/disponibles — ADMIN o DESPACHADOR
router.get('/repartidores/disponibles', authenticate, requireRole('ADMIN', 'DESPACHADOR'), async (req: Request, res: Response) => {
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : undefined;
  const result = await ReportesController.getRepartidoresDisponibles(sucursalId);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;