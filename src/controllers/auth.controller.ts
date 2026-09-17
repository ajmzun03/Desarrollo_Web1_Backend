import { UsuarioModel } from '../model/supabase/usuario.model.js';
import { comparePassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';

export const AuthController = {
  async login(usuario: string, contrasenia: string) {
    if (!usuario || !contrasenia) {
      return { data: null, error: 'Usuario y contraseña requeridos', status: 400 };
    }

    const user = await UsuarioModel.getByUsuario(usuario);

    if (!user) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const isValid = await comparePassword({ input: contrasenia, hashedInput: user.contrasenia ?? '' });

    if (!isValid) {
      return { data: null, error: 'Credenciales inválidas', status: 401 };
    }

    const token = generarToken({
      id: user.id,
      usuario: user.usuario,
      rol: user.rol
    });

    if (!token) {
      return { data: null, error: 'Error al generar token', status: 500 };
    }

    const { contrasenia: _, ...userWithoutPassword } = user;

    return {
      data: { usuario: userWithoutPassword, token },
      error: null,
      status: 200
    };
  },

  async logout() {
    return {
      data: { message: 'Sesión cerrada exitosamente' },
      error: null,
      status: 200
    };
  },

  async me(token: string) {
    if (!token) {
      return { data: null, error: 'Token no proporcionado', status: 401 };
    }

    const decoded = getInfoToToken(token);

    if (!decoded) {
      return { data: null, error: 'Token inválido o expirado', status: 401 };
    }

    const usuario = await UsuarioModel.getById(Number(decoded.id));

    if (!usuario) {
      return { data: null, error: 'Usuario no encontrado', status: 404 };
    }

    return { data: usuario, error: null, status: 200 };
  }
};