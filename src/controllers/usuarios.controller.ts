import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { hassPassword } from '../utils/hashPassword.js';

export const UsuariosController = {
  async getAll() {
    try {
      const usuarios = await UsuarioModel.getAll();
      return { data: usuarios, error: null, status: 200 };
    } catch (error) {
      console.error('Error get usuarios:', error);
      return { data: null, error: 'Error al obtener usuarios', status: 500 };
    }
  },

  async getById(id: number) {
    try {
      const usuario = await UsuarioModel.getById(id);
      if (!usuario) {
        return { data: null, error: 'Usuario no encontrado', status: 404 };
      }
      return { data: usuario, error: null, status: 200 };
    } catch (error) {
      console.error('Error get usuario:', error);
      return { data: null, error: 'Error al obtener usuario', status: 500 };
    }
  },

  async create(data: { usuario: string; correo_electronico?: string; contrasenia: string; rol: string }) {
    try {
      if (!data.usuario || !data.contrasenia || !data.rol) {
        return { data: null, error: 'usuario, contrasenia y rol son requeridos', status: 400 };
      }
      const hashedPassword = await hassPassword(data.contrasenia);
      const nuevoUsuario = await UsuarioModel.create({
        ...data,
        contrasenia: hashedPassword
      });
      const { contrasenia: _, ...userWithoutPassword } = nuevoUsuario;
      return { data: userWithoutPassword, error: null, status: 201 };
    } catch (error) {
      console.error('Error create usuario:', error);
      return { data: null, error: 'Error al crear usuario', status: 500 };
    }
  },

  async update(id: number, data: { contrasenia?: string; [key: string]: any }) {
    try {
      if (data.contrasenia) {
        data.contrasenia = await hassPassword(data.contrasenia);
      }
      const usuario = await UsuarioModel.update(id, data);
      if (!usuario) {
        return { data: null, error: 'Usuario no encontrado', status: 404 };
      }
      const { contrasenia: _, ...userWithoutPassword } = usuario;
      return { data: userWithoutPassword, error: null, status: 200 };
    } catch (error) {
      console.error('Error update usuario:', error);
      return { data: null, error: 'Error al actualizar usuario', status: 500 };
    }
  }
};