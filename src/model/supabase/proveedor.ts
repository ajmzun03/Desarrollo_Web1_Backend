import { db } from "./db.js"
import type { IProveedorModel } from "../../types.js";
import { proveedorTable } from "../../schemas/db.js";
import { eq } from "drizzle-orm";

export const ProveedorModel: IProveedorModel = {
  async getAll() {
    const proveedores = await db.select().from(proveedorTable).limit(100).offset(0);
    if(proveedores.length === 0) {
      throw new Error("No se encontraron proveedores");
    }
    return proveedores;
  },
  async getById(id: number){
    const proveedor = await db.select().from(proveedorTable).where(eq(proveedorTable.id, id));
    if(!proveedor[0]) {
      throw new Error("Proveedor no encontrado");
    }
    return proveedor[0] || null;
  },
  async create(data: any): Promise<any> {
    const [result] = await db.insert(proveedorTable).values({...data}).returning()
    return result;
  },
  async update(id: number, data: any) {}
}