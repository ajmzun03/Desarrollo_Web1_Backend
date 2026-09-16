import { db } from "./db.model.js"
import { usuarioTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type { IUsuarioModel } from "../../types.js";
import type { InsertUsuario, SelectUsuario, UpdateUsuario } from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

// Columnas seguras para exponer al cliente (sin contrasenia)
const columnasSeguras = {
    id: usuarioTable.id,
    usuario: usuarioTable.usuario,
    correo_electronico: usuarioTable.correo_electronico,
    rol: usuarioTable.rol,
    creado_en: usuarioTable.creado_en,
}

export const UsuarioModel: IUsuarioModel = {
    async getAll(): Promise<Omit<SelectUsuario, 'contrasenia'>[]> {
        const usuarios = await db.select(columnasSeguras).from(usuarioTable).limit(100).offset(0);
        if (usuarios.length === 0) {
            logger.warn("No se encontraron usuarios");
            throw new Error("No se encontraron usuarios");
        }
        logger.info(`Se encontraron ${usuarios.length} usuarios`);
        return usuarios;
    },
    async getById(id: number): Promise<Omit<SelectUsuario, 'contrasenia'> | null> {
        const usuario = await db.select(columnasSeguras).from(usuarioTable).where(eq(usuarioTable.id, id));
        if (!usuario[0]) {
            logger.warn(`Usuario con id ${id} no encontrado`);
            throw new Error("Usuario no encontrado");
        }
        logger.info(`Usuario con id ${id} encontrado`);
        return usuario[0];
    },
    async getByUsuario(usuario: string): Promise<SelectUsuario | null> {
        const usuarios = await db.select().from(usuarioTable).where(eq(usuarioTable.usuario, usuario)).limit(1);
        if (!usuarios[0]) {
            logger.warn(`Usuario con nombre ${usuario} no encontrado`);
            return null;
        }
        logger.info(`Usuario con nombre ${usuario} encontrado`);
        return usuarios[0];
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