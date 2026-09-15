import { db } from "./db.model.js"
import { hojaDespachoTable, hojaDespachoDetalleTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IHojaDespachoModel, IHojaDespachoDetalleModel } from "../../types.js";
import type { InsertHojaDespacho, SelectHojaDespacho, InsertHojaDespachoDetalle, SelectHojaDespachoDetalle } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const HojaDespachoModel: IHojaDespachoModel = {
  async getAll(): Promise<SelectHojaDespacho[]> {
    const hojas = await db.select().from(hojaDespachoTable).limit(100).offset(0);
    if (hojas.length === 0) {
      logger.warn("No se encontraron hojas de despacho");
      throw new Error("No se encontraron hojas de despacho");
    }
    logger.info(`Se encontraron ${hojas.length} hojas de despacho`);
    return hojas;
  },

  async getById(id: number): Promise<SelectHojaDespacho | null> {
    const hoja = await db.select().from(hojaDespachoTable).where(eq(hojaDespachoTable.id, id)).limit(1);
    if (hoja.length === 0) {
      logger.warn(`Hoja de despacho con ID ${id} no encontrada`);
      throw new Error("Hoja de despacho no encontrada");
    }
    logger.info(`Hoja de despacho con ID ${id} encontrada`);
    return hoja[0] || null;
  },

  async getByPedidoId(pedidoId: number): Promise<SelectHojaDespacho[]> {
    const hojas = await db.select().from(hojaDespachoTable).where(eq(hojaDespachoTable.pedido_id, pedidoId));
    logger.info(`Se encontraron ${hojas.length} hojas de despacho para el pedido ${pedidoId}`);
    return hojas;
  },

  async create(data: InsertHojaDespacho): Promise<SelectHojaDespacho> {
    const [result] = await db.insert(hojaDespachoTable).values({ ...data }).returning();
    if (result) {
      logger.info("Hoja de despacho creada exitosamente");
      return result;
    }
    logger.error("Error al crear la hoja de despacho");
    throw new Error("Error al crear la hoja de despacho");
  }
}

export const HojaDespachoDetalleModel: IHojaDespachoDetalleModel = {
  async getByHojaDespachoId(hojaDespachoId: number): Promise<SelectHojaDespachoDetalle[]> {
    const detalles = await db.select().from(hojaDespachoDetalleTable).where(eq(hojaDespachoDetalleTable.hoja_despacho_id, hojaDespachoId));
    logger.info(`Se encontraron ${detalles.length} detalles para la hoja de despacho ${hojaDespachoId}`);
    return detalles;
  },

  async create(data: InsertHojaDespachoDetalle): Promise<SelectHojaDespachoDetalle> {
    const [result] = await db.insert(hojaDespachoDetalleTable).values({ ...data }).returning();
    if (result) {
      logger.info("Detalle de hoja de despacho creado exitosamente");
      return result;
    }
    logger.error("Error al crear el detalle de hoja de despacho");
    throw new Error("Error al crear el detalle de hoja de despacho");
  }
}