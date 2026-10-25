/**
 * Vistas (pantallas / secciones del frontend) a las que puede entrar cada rol.
 *
 * El backend es la fuente de verdad: `GET /auth/me`, la respuesta de `POST /auth/verificar` y las de
 * `/cliente/auth/*` devuelven `vistas` para que el frontend arme el menú y proteja sus rutas con ESTA
 * lista, en vez de decidirlo por su cuenta. Los permisos reales siguen aplicándose en cada endpoint
 * (una vista oculta no es una protección; el 403 del API sí lo es).
 *
 * Los nombres son claves estables (kebab-case); el frontend las asocia a sus rutas.
 */
export type RolConVistas =
  | 'ADMIN' | 'GERENTE' | 'CAJERO' | 'DESPACHADOR' | 'REPARTIDOR'
  | 'BODEGUERO' | 'COMPRAS' | 'COCINERO' | 'JEFE_COCINA' | 'CLIENTE';

const COCINA = ['cocina', 'ordenes-trabajo', 'recetas', 'solicitudes-insumo', 'alacenas'];

export const VISTAS_POR_ROL: Record<RolConVistas, readonly string[]> = {
  ADMIN: [
    'dashboard', 'usuarios', 'clientes', 'pedidos', 'pos', 'despacho', 'repartidores', 'turnos', 'cajas',
    'liquidaciones', 'facturas-venta', 'facturas-compra', 'gastos', 'reportes', 'productos', 'categorias',
    'combos', 'productos-extra', 'unidades-medida', 'sucursales', 'proveedores', 'materias-primas',
    'compras', 'ordenes-compra', 'inventario', 'bodegas', 'alacenas', 'recepcion', 'traslados', 'stock',
    'kardex', 'solicitudes-insumo', 'cocina', 'ordenes-trabajo', 'recetas'
  ],
  GERENTE: [
    'dashboard', 'reportes', 'pedidos', 'clientes', 'facturas-venta', 'facturas-compra', 'gastos',
    'ordenes-compra', 'inventario', 'turnos', 'cajas', 'liquidaciones'
  ],
  CAJERO: ['pos', 'pedidos', 'clientes', 'facturas-venta', 'turnos', 'cajas'],
  DESPACHADOR: ['despacho', 'pedidos', 'clientes', 'repartidores', 'turnos', 'cajas', 'liquidaciones'],
  REPARTIDOR: ['repartidor', 'pedidos-asignados', 'liquidaciones'],
  BODEGUERO: [
    'inventario', 'bodegas', 'alacenas', 'recepcion', 'traslados', 'stock', 'kardex', 'solicitudes-insumo',
    'ordenes-compra', 'materias-primas', 'productos'
  ],
  COMPRAS: ['compras', 'ordenes-compra', 'facturas-compra', 'proveedores', 'materias-primas'],
  COCINERO: COCINA,
  JEFE_COCINA: COCINA,
  CLIENTE: ['menu', 'mis-pedidos', 'mis-direcciones', 'perfil']
};

/** Vistas del rol; un rol desconocido no ve ninguna (falla cerrado). */
export function vistasDe(rol: string | null | undefined): string[] {
  if (!rol) return [];
  return [...(VISTAS_POR_ROL[rol as RolConVistas] ?? [])];
}
