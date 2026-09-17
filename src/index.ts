import express from "express";
import cookieParser from 'cookie-parser'
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit"
import { corsMiddleware } from "./middleware/cors.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from "./middleware/errorHandler.js";
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

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  legacyHeaders: false,
  message: {message: 'Demasiadas request, Por favor intenta más tarde.'}
})

const PORT = process.env.PORT ?? 3000;
app.use(limiter)
app.use(cookieParser())
app.use(corsMiddleware())
app.use(express.json());
app.disable('x-powered-by')

// Rutas públicas
app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
// Documentación interactiva (Swagger UI)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth (login/logout son públicos, /me se protege internamente)
app.use('/auth', authRoutes);

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

// Cocina
app.use('/recetas', recetasRoutes);
app.use('/ordenes-trabajo', ordenesTrabajoRoutes);

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

// Despacho
app.use('/turnos', turnosRoutes);
app.use('/hojas-despacho', hojasDespachoRoutes);
app.use('/cajas', cajasRoutes);
app.use('/liquidaciones', liquidacionesRoutes);

// Admin y Gerencia
app.use('/gastos-sucursal', gastosSucursalRoutes);
app.use('/reportes', reportesRoutes);

// Handler global de errores (debe ir después de todas las rutas)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});