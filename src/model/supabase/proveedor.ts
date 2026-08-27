import { db } from "./db.js"
import { proveedorTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";
// import logger from "pino";
import type { IProveedorModel } from "../../types.js";
import type { InsertProveedor, SelectProveedor } from "../../schemas/db.js";

export const ProveedorModel: IProveedorModel = {
  async getAll(): Promise<SelectProveedor[] | null> {
    const proveedores = await db.select().from(proveedorTable).limit(100).offset(0);
    if (proveedores.length === 0) {
      throw new Error("No se encontraron proveedores");
    }
    return proveedores;
  },
  async getById(id: number): Promise<SelectProveedor | null> {
    const proveedor = await db.select().from(proveedorTable).where(eq(proveedorTable.id, id));
    if (!proveedor[0]) {
      throw new Error("Proveedor no encontrado");
    }
    return proveedor[0] || null;
  },
  async create(data: InsertProveedor): Promise<SelectProveedor> {
    const [result] = await db.insert(proveedorTable).values({ ...data }).returning()
    if (result) {
      return result;
    }
    throw new Error("Error al crear el proveedor");
  },
  async update(data: Partial<InsertProveedor>): Promise<SelectProveedor | null> {
    if (data.id !== undefined) {
      const [result] = await db.update(proveedorTable).set(data).where(eq(proveedorTable.id, data.id)).returning();
      if (result) {
        return result;
      }
    }
    throw new Error("Error al actualizar el proveedor");
  }
}