import { db } from "./db.js";
import {sucursalTable} from "../../schemas/db.js";
import {eq} from "drizzle-orm";

import type { ISucursalModel } from "../../types.js";
import type { InsertSucursal, SelectSucursal, UpdateSucursal } from "../../schemas/db.js";

export const SucursalModel: ISucursalModel = {
    async getAll(): Promise<SelectSucursal[]> {
        const sucursales = await db.select().from(sucursalTable).limit(100).offset(0);
        if (sucursales.length === 0) {
            throw new Error("No se encontraron sucursales");
        }
        return sucursales;
    },
    async getById(id: number): Promise<SelectSucursal | null> {
        const sucursal = await db.select().from(sucursalTable).where(eq(sucursalTable.id, id));
        if (!sucursal[0]) {
            throw new Error("Sucursal no encontrada");
        }
        return sucursal[0] || null;
    },
    async create(data: InsertSucursal): Promise<SelectSucursal> {
        const [result] = await db.insert(sucursalTable).values({ ...data }).returning(); 
        if (result) {
            return result;
        }
        throw new Error("Error al crear la sucursal");
    },
    async update(id: number, data: UpdateSucursal): Promise<SelectSucursal | null> {
        const [result] = await db.update(sucursalTable).set(data).where(eq(sucursalTable.id, id)).returning();
        if (result) {
            return result;
        }
        throw new Error("Error al actualizar la sucursal");
    }
}