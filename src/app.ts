import express from "express";
import helmet from 'helmet'
import logger from './config/logger.js'
import pagosRoutes from './routes/pagos.routes.js';
import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit"
import { corsMiddleware } from "./middleware/cors.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import authRoutes from './routes/auth.routes.js';
import sucursalesRoutes from './routes/sucursales.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import unidadesMedidaRoutes from './routes/unidadesMedida.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import materiasPrimasRoutes from './routes/materiasPrimas.routes.js';
import productosRoutes from './routes/productos.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import recetasRoutes from './routes/recetas.routes.js';
import ordenesTrabajoRoutes from './routes/ordenesTrabajo.routes.js';
import ordenesCompraRoutes from './routes/ordenesCompra.routes.js';
import facturasCompraRoutes from './routes/facturasCompra.routes.js';
import bodegasRoutes from './routes/bodegas.routes.js';
import alacenasRoutes from './routes/alacenas.routes.js';
import hojasRecepcionRoutes from './routes/hojasRecepcion.routes.js';
import turnosRoutes from './routes/turnos.routes.js';
import hojasDespachoRoutes from './routes/hojasDespacho.routes.js';
import gastosSucursalRoutes from './routes/gastosSucursal.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import municipiosRoutes from './routes/municipios.routes.js';
import direccionesRoutes from './routes/direcciones.routes.js';
import cajasRoutes from './routes/cajas.routes.js';
import liquidacionesRoutes from './routes/liquidaciones.routes.js';
import facturasVentaRoutes from './routes/facturasVenta.routes.js';
import stockBodegaRoutes from './routes/stockBodega.routes.js';
import stockAlacenaRoutes from './routes/stockAlacena.routes.js';
import kardexBodegaRoutes from './routes/kardexBodega.routes.js';
import kardexAlacenaRoutes from './routes/kardexAlacena.routes.js';
import combosRoutes from './routes/combos.routes.js';
import productosExtraRoutes from './routes/productosExtra.routes.js';
import solicitudesInsumoRoutes from './routes/solicitudesInsumo.routes.js';
import archivosRoutes from './routes/archivos.routes.js';
import usuarioClienteRoutes from './routes/usuarioCliente.routes.js';
import inventarioRoutes from './routes/inventario.routes.js';
import repartidorRoutes from './routes/repartidor.routes.js';
import { IS_PROD, RATE_LIMIT_MAX, DOCS_HABILITADAS } from "./config.js";
import { PagosController } from "./controllers/pagos.controller.js";
import { redisHealth } from "./services/redis.js";



const app: Express = express();

if (IS_PROD) app.set('trust proxy', 1) // trust first proxy

app.use(requestLogger);
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // En desarrollo el panel dispara muchas peticiones por pantalla: se afloja para no bloquear al equipo
  limit: IS_PROD ? RATE_LIMIT_MAX : Math.max(RATE_LIMIT_MAX, 5000),
  legacyHeaders: false,
  // El health check de la plataforma y los webhooks de Stripe no deben consumir cupo
  // Los preflight OPTIONS de CORS no son uso real de la API
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health' || req.path === '/pagos/webhook',
  message: { data: null, error: 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.' }
})

// CORS va primero: así el navegador también puede leer la respuesta 429 (si no, la muestra como "sin conexión")
app.use(corsMiddleware())
app.use(limiter)
// Webhook de Stripe: necesita el cuerpo CRUDO para validar la firma, así que va ANTES de express.json()
app.post('/pagos/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const firma = req.headers['stripe-signature'];
  const result = await PagosController.procesarWebhook(
    Buffer.isBuffer(req.body) ? req.body : Buffer.from(''),
    typeof firma === 'string' ? firma : undefined
  );
  res.status(result.status).json({ data: result.data, error: result.error });
});

app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by')

// Rutas públicas
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const redisStatus = await redisHealth();
    res
      .status(200)
      .json({
        status: redisStatus === 'ok' ? "ok" : "degraded",
        message: "API de gestión de inventario y ventas",
        redis: redisStatus,
        docs: DOCS_HABILITADAS ? "/docs" : undefined
      });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error al verificar la salud de la API",
        redis: 'error'
      });
  }
});

// Documentación interactiva (Swagger UI)
if (DOCS_HABILITADAS) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Auth (login/logout son públicos, /me se protege internamente)
app.use('/auth', authRoutes);

// Auth cliente final (app móvil/web del cliente)
app.use('/cliente/auth', usuarioClienteRoutes);

// Archivos (URLs prefirmadas S3)
app.use('/archivos', archivosRoutes);

// Catálogos (lectura pública, escritura protegida)
app.use('/sucursales', sucursalesRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/unidades-medida', unidadesMedidaRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/materias-primas', materiasPrimasRoutes);
app.use('/productos', productosRoutes);
app.use('/municipios', municipiosRoutes);

// Ventas
app.use('/clientes', clientesRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/direcciones', direccionesRoutes);
app.use('/facturas-venta', facturasVentaRoutes);
app.use('/combos', combosRoutes);
app.use('/productos-extra', productosExtraRoutes);

// Cocina
app.use('/recetas', recetasRoutes);
app.use('/ordenes-trabajo', ordenesTrabajoRoutes);
app.use('/solicitudes-insumo', solicitudesInsumoRoutes);

// Compras
app.use('/ordenes-compra', ordenesCompraRoutes);
app.use('/facturas-compra', facturasCompraRoutes);

// Bodega
app.use('/bodegas', bodegasRoutes);
app.use('/alacenas', alacenasRoutes);
app.use('/hojas-recepcion', hojasRecepcionRoutes);
app.use('/stock-bodega', stockBodegaRoutes);
app.use('/stock-alacena', stockAlacenaRoutes);
app.use('/kardex-bodega', kardexBodegaRoutes);
app.use('/kardex-alacena', kardexAlacenaRoutes);

// Inventario (traslados, ingreso por vale, cuadre, bajo mínimo)
app.use('/', inventarioRoutes);

// Despacho
app.use('/turnos', turnosRoutes);
app.use('/hojas-despacho', hojasDespachoRoutes);
app.use('/cajas', cajasRoutes);
app.use('/liquidaciones', liquidacionesRoutes);

// Repartidor (app móvil)
app.use('/repartidor', repartidorRoutes);

// Admin y Gerencia
app.use('/gastos-sucursal', gastosSucursalRoutes);
app.use('/reportes', reportesRoutes);

//PAGOS STRIPE
app.use('/pagos', pagosRoutes);

// Handler global de errores (debe ir después de todas las rutas)
app.use(errorHandler);

export default app;
