import { db } from "./db.model.js"
import { usuarioTable } from "../../schemas/db.schema.js";
import { eq, or, sql, asc } from "drizzle-orm";
import type { IUsuarioModel } from "../../types.js";
import type { InsertUsuario, SelectUsuario, UpdateUsuario } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

// Columnas seguras para exponer al cliente (sin contrasenia)
const columnasSeguras = {
    id: usuarioTable.id,
    usuario: usuarioTable.usuario,
    correo_electronico: usuarioTable.correo_electronico,
    telefono: usuarioTable.telefono,
    rol: usuarioTable.rol,
    activo: usuarioTable.activo,
    creado_en: usuarioTable.creado_en,
}

export const UsuarioModel: IUsuarioModel = {
    async getAll(): Promise<Omit<SelectUsuario, 'contrasenia'>[]> {
        const usuarios = await db.select(columnasSeguras).from(usuarioTable).orderBy(asc(usuarioTable.id)).limit(100).offset(0);
        logger.info(`Se encontraron ${usuarios.length} usuarios`);
        return usuarios;
    },
    async getById(id: number): Promise<Omit<SelectUsuario, 'contrasenia'> | null> {
        const usuario = await db.select(columnasSeguras).from(usuarioTable).where(eq(usuarioTable.id, id));
        if (!usuario[0]) {
            logger.warn(`Usuario con id ${id} no encontrado`);
            return null;
        }
        logger.info(`Usuario con id ${id} encontrado`);
        return usuario[0];
    },
    async getByUsuario(usuario: string): Promise<SelectUsuario | null> {
        const usuarios = await db.select().from(usuarioTable).where(eq(usuarioTable.usuario, usuario)).limit(1);
        if (!usuarios[0]) {
            logger.warn("Usuario no encontrado por nombre de usuario");
            return null;
        }
        logger.info("Usuario encontrado por nombre de usuario");
        return usuarios[0];
    },
    async getByUsuarioOrCorreo(identificador: string): Promise<SelectUsuario | null> {
        const usuarios = await db.select().from(usuarioTable)
            .where(or(eq(usuarioTable.usuario, identificador), eq(usuarioTable.correo_electronico, identificador)))
            .limit(1);
        if (!usuarios[0]) {
            logger.warn("Usuario no encontrado por identificador");
            return null;
        }
        logger.info("Usuario encontrado por identificador");
        return usuarios[0];
    },
    // Busqueda por correo sin distinguir mayusculas (el correo verificado por Supabase viene en minusculas)
    async getByCorreo(correo: string): Promise<SelectUsuario | null> {
        const usuarios = await db.select().from(usuarioTable)
            .where(eq(sql`lower(${usuarioTable.correo_electronico})`, correo.trim().toLowerCase()))
            .limit(1);
        return usuarios[0] ?? null;
    },
    async getByRol(rol: string): Promise<Omit<SelectUsuario, 'contrasenia'>[]> {
        const usuarios = await db.select(columnasSeguras).from(usuarioTable).where(eq(usuarioTable.rol, rol as any));
        logger.info(`Se encontraron ${usuarios.length} usuarios con rol ${rol}`);
        return usuarios;
    },
    async create(data: InsertUsuario): Promise<SelectUsuario> {
        const [result] = await db.insert(usuarioTable).values({ ...data }).returning();
        if (result) {
            logger.info("Usuario creado exitosamente");
            return result;
        }
        logger.error("Error al crear el usuario");
        throw new Error("Error al crear el usuario");
    },
    async update(id: number, data: UpdateUsuario): Promise<SelectUsuario | null> {
        const [result] = await db.update(usuarioTable).set(data).where(eq(usuarioTable.id, id)).returning();
        if (result) {
            logger.info(`Usuario con id ${id} actualizado exitosamente`);
            return result;
        }
        logger.error(`Error al actualizar el usuario con id ${id}`);
        throw new Error("Error al actualizar el usuario");
    }
}