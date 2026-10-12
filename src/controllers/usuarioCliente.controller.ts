import { UsuarioClienteModel } from '../model/supabase/usuarioCliente.model.js';
import { ClienteModel } from '../model/supabase/cliente.model.js';
import { hassPassword, comparePassword } from '../utils/hashPassword.js';
import { generarToken, getInfoToToken } from '../utils/generateToken.js';
import logger from '../config/logger.js';

export const UsuarioClienteController = {
  async registro(data: {
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
    telefono_ref?: string;
    contrasenia: string;
  }) {
    try {
      const existente = await UsuarioClienteModel.getByCorreo(data.correo_electronico);
      if (existente) {
        return { data: null, error: 'Ya existe una cuenta con este correo electrónico', status: 409 };
      }

      const hashedPassword = await hassPassword(data.contrasenia);
      const resultado = await UsuarioClienteModel.create({
        cliente: {
          nombre: data.nombre,
          apellido: data.apellido,
          correo_electronico: data.correo_electronico,
          telefono: data.telefono,
          telefono_ref: data.telefono_ref ?? null
        },
        contrasenia: hashedPassword
      });

      const token = generarToken({
        id: Number(resultado.cliente.id),
        correo_electronico: resultado.cliente.correo_electronico,
        rol: 'CLIENTE',
        tipo: 'cliente'
      });

      return {
        data: {
          cliente: resultado.cliente,
          token
        },
        error: null,
        status: 201
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al registrar cliente:');
      return { data: null, error: 'Error al registrar cliente', status: 500 };
    }
  },

  async login(correo_electronico: string, contrasenia: string) {
    try {
      const registro = await UsuarioClienteModel.getByCorreo(correo_electronico);
      if (!registro || !registro.usuarioCliente.activo) {
        return { data: null, error: 'Credenciales inválidas', status: 401 };
      }

      const passwordMatch = await comparePassword({
        input: contrasenia,
        hashedInput: registro.usuarioCliente.contrasenia
      });

      if (!passwordMatch) {
        return { data: null, error: 'Credenciales inválidas', status: 401 };
      }

      const token = generarToken({
        id: Number(registro.cliente.id),
        correo_electronico: registro.cliente.correo_electronico,
        rol: 'CLIENTE',
        tipo: 'cliente'
      });

      return {
        data: {
          cliente: registro.cliente,
          token
        },
        error: null,
        status: 200
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al iniciar sesión cliente:');
      return { data: null, error: 'Error al iniciar sesión', status: 500 };
    }
  },

  async me(token: string) {
    try {
      const decoded = getInfoToToken(token);
      if (!decoded || !decoded.id) {
        return { data: null, error: 'Token inválido o expirado', status: 401 };
      }

      const cliente = await ClienteModel.getById(Number(decoded.id));
      if (!cliente) {
        return { data: null, error: 'Cliente no encontrado', status: 404 };
      }

      return { data: cliente, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al obtener perfil de cliente:');
      return { data: null, error: 'Error al obtener datos del cliente', status: 500 };
    }
  }
};
