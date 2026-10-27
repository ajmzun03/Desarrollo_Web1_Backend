import { db } from "./db.model.js";
import { solicitudInsumoTable, detalleSolicitudInsumoTable } from "../../schemas/db.schema.js";
import { eq, asc } from "drizzle-orm";
import type {
  SelectSolicitudInsumo,
  InsertSolicitudInsumo,
  UpdateSolicitudInsumo,
  SelectDetalleSolicitudInsumo,
  InsertDetalleSolicitudInsumo
} from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const SolicitudInsumoModel = {
  async getAll(): Promise<SelectSolicitudInsumo[]> {
    const solicitudes = await db.select().from(solicitudInsumoTable).orderBy(asc(solicitudInsumoTable.id)).limit(100);
    logger.info(`Se encontraron ${solicitudes.length} solicitudes de insumos`);
    return solicitudes;
  },

  async getById(id: number): Promise<SelectSolicitudInsumo | null> {
    const [solicitud] = await db
      .select()
      .from(solicitudInsumoTable)
      .where(eq(solicitudInsumoTable.id, id))
      .limit(1);
    return solicitud || null;
  },

  async getBySucursalId(sucursalId: number): Promise<SelectSolicitudInsumo[]> {
    return await db
      .select()
      .from(solicitudInsumoTable)
      .where(eq(solicitudInsumoTable.sucursal_id, sucursalId));
  },

  async getByEstado(estado: 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'CANCELADA'): Promise<SelectSolicitudInsumo[]> {
    return await db
      .select()
      .from(solicitudInsumoTable)
      .where(eq(solicitudInsumoTable.estado, estado));
  },

  async create(data: InsertSolicitudInsumo): Promise<SelectSolicitudInsumo> {
    const [solicitud] = await db
      .insert(solicitudInsumoTable)
      .values(data)
      .returning();
    if (!solicitud) {
      throw new Error("Error al crear solicitud de insumo");
    }
    return solicitud;
  },

  async update(id: number, data: UpdateSolicitudInsumo): Promise<SelectSolicitudInsumo | null> {
    const [solicitud] = await db
      .update(solicitudInsumoTable)
      .set(data)
      .where(eq(solicitudInsumoTable.id, id))
      .returning();
    return solicitud || null;
  },

  async getDetalles(solicitudId: number): Promise<SelectDetalleSolicitudInsumo[]> {
    return await db
      .select()
      .from(detalleSolicitudInsumoTable)
      .where(eq(detalleSolicitudInsumoTable.solicitud_id, solicitudId));
  },

  async createDetalle(data: InsertDetalleSolicitudInsumo): Promise<SelectDetalleSolicitudInsumo> {
    const [detalle] = await db
      .insert(detalleSolicitudInsumoTable)
      .values(data)
      .returning();
    if (!detalle) {
      throw new Error("Error al crear detalle de solicitud de insumo");
    }
    return detalle;
  },

  async updateDetalleRecibido(id: number, cantidadRecibida: number): Promise<SelectDetalleSolicitudInsumo | null> {
    const [detalle] = await db
      .update(detalleSolicitudInsumoTable)
      .set({ cantidad_recibida: String(cantidadRecibida) })
      .where(eq(detalleSolicitudInsumoTable.id, id))
      .returning();
    return detalle || null;
  }
};
