import { db } from "./db.model.js";
import { UsuarioClienteTable, clienteTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import type {
  SelectUsuarioCliente,
  InsertUsuarioCliente,
  SelectCliente,
  InsertCliente
} from "../../schemas/db.schema.js";
import logger from "../../config/logger.js";

export const UsuarioClienteModel = {
  async getByClienteId(clienteId: number): Promise<SelectUsuarioCliente | null> {
    const [user] = await db
      .select()
      .from(UsuarioClienteTable)
      .where(eq(UsuarioClienteTable.cliente_id, clienteId))
      .limit(1);
    return user || null;
  },

  async getByCorreo(correo: string): Promise<{ cliente: SelectCliente; usuarioCliente: SelectUsuarioCliente } | null> {
    const [cliente] = await db
      .select()
      .from(clienteTable)
      .where(eq(clienteTable.correo_electronico, correo))
      .limit(1);

    if (!cliente) return null;

    const [usuarioCliente] = await db
      .select()
      .from(UsuarioClienteTable)
      .where(eq(UsuarioClienteTable.cliente_id, Number(cliente.id)))
      .limit(1);

    if (!usuarioCliente) return null;

    return { cliente, usuarioCliente };
  },

  async create(data: { cliente: InsertCliente; contrasenia: string }): Promise<{ cliente: SelectCliente; usuarioCliente: SelectUsuarioCliente }> {
    const [nuevoCliente] = await db.insert(clienteTable).values(data.cliente).returning();
    if (!nuevoCliente) throw new Error("Error al registrar datos del cliente");

    const [nuevoUsuario] = await db.insert(UsuarioClienteTable).values({
      cliente_id: Number(nuevoCliente.id),
      contrasenia: data.contrasenia,
      activo: true
    }).returning();

    if (!nuevoUsuario) throw new Error("Error al registrar credenciales del cliente");

    logger.info(`Cliente registrado exitosamente con ID ${nuevoCliente.id}`);
    return { cliente: nuevoCliente, usuarioCliente: nuevoUsuario };
  }
};
