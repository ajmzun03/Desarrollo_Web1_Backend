import { PedidoModel } from '../model/supabase/pedido.model.js';
import logger from '../config/logger.js';
import { DetallePedidoModel } from '../model/supabase/detallePedido.model.js';
import { HojaDespachoModel } from '../model/supabase/hojaDespacho.model.js';
import { crearPedido, type CrearPedidoInput } from '../services/pedidos.service.js';
import { errorDb, ErrorNegocio } from '../utils/errors.js';
import { TRANSICIONES_PEDIDO, validarTransicion } from '../utils/transiciones.js';
import { esCliente } from '../middleware/auth.js';
import { exigirAsignado, esRepartidor } from '../services/asignaciones.service.js';
import { stripe } from '../config/stripe.js';
import type { DecodedToken } from '../jwt.js';

type EstadoPedido = 'ANULADO' | 'CREADO' | 'ENTREGADO' | 'EN_RUTA' | 'LISTO' | 'EN_PREPARACION' | 'EN_DESPACHO';

const ROLES_QUE_CREAN_PEDIDOS = ['ADMIN', 'CAJERO'];
const MAX_OBSERVACIONES = 255;

/** Un cliente solo puede ver sus pedidos; el personal ve todos. */
function verificarAcceso(pedido: { cliente_id: unknown }, user: DecodedToken) {
  if (esCliente(user) && Number(pedido.cliente_id) !== Number(user.id)) {
    throw new ErrorNegocio('Pedido no encontrado', 404);
  }
}

/** Un repartidor solo puede operar pedidos que tiene asignados en una hoja de despacho. */
async function verificarAsignacion(pedidoId: number, user: DecodedToken) {
  if (user.rol !== 'REPARTIDOR') return;
  const hojas = await HojaDespachoModel.getByPedidoId(pedidoId);
  if (!hojas.some(h => Number(h.repartidor_id) === Number(user.id))) {
    throw new ErrorNegocio('El pedido no está asignado a este repartidor', 403);
  }
}

async function obtenerPedido(id: number) {
  const pedido = await PedidoModel.getPedidoId(id);
  if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
  return pedido;
}

export const PedidosController = {
  async getAll(user: DecodedToken, opts: { limit: number; offset: number; estado?: string | undefined }) {
    try {
      // Cada rol ve solo lo suyo: el cliente sus pedidos, el repartidor los que tiene asignados
      if (esRepartidor(user)) return await PedidosController.getPedidosRepartidor(Number(user.id), false);
      const pedidos = esCliente(user)
        ? await PedidoModel.getByClienteId(Number(user.id))
        : await PedidoModel.getPaginado(opts);
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get pedidos:');
      return errorDb(error, 'Error al obtener pedidos');
    }
  },

  async getListos() {
    try {
      const pedidos = await PedidoModel.getByEstado('LISTO');
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get pedidos listos:');
      return errorDb(error, 'Error al obtener pedidos listos');
    }
  },

  async getById(id: number, user: DecodedToken) {
    try {
      const pedido = await obtenerPedido(id);
      verificarAcceso(pedido, user);
      await exigirAsignado(user, 'pedido', id);
      const detalles = await DetallePedidoModel.getByPedidoId(id);
      return { data: { ...pedido, detalles }, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get pedido:');
      return errorDb(error, 'Error al obtener pedido');
    }
  },

  async create(data: Omit<CrearPedidoInput, 'cliente_id'> & { cliente_id?: number | undefined }, user: DecodedToken) {
    try {
      let clienteId: number;
      if (esCliente(user)) {
        // Un cliente solo puede crear pedidos para sí mismo.
        clienteId = Number(user.id);
      } else {
        if (!user.rol || !ROLES_QUE_CREAN_PEDIDOS.includes(user.rol)) {
          return { data: null, error: 'Tu rol no puede crear pedidos', status: 403 };
        }
        if (!data.cliente_id) {
          return { data: null, error: 'cliente_id es requerido', status: 400 };
        }
        clienteId = data.cliente_id;
      }

      const nuevoPedido = await crearPedido({ ...data, cliente_id: clienteId });
      return { data: nuevoPedido, error: null, status: 201 };
    } catch (error) {
      logger.error({ err: error }, 'Error create pedido:');
      return errorDb(error, 'Error al crear pedido');
    }
  },

  async confirmar(id: number) {
    try {
      const actual = await obtenerPedido(id);
      validarTransicion(TRANSICIONES_PEDIDO, actual.estado, 'LISTO', 'el pedido');
      if (actual.metodo_pago === 'TARJETA' && !actual.pagado) {
        return { data: null, error: 'El pedido con tarjeta aún no tiene el pago confirmado', status: 409 };
      }
      const pedido = await PedidoModel.updatePedido(id, { estado: 'LISTO' });
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error confirmar pedido:');
      return errorDb(error, 'Error al confirmar pedido');
    }
  },

  /** El cliente deja de pagar con tarjeta y pasa a efectivo contra entrega (solo si aún no se cobró nada). */
  async cambiarAEfectivo(id: number, user: DecodedToken) {
    try {
      const actual = await obtenerPedido(id);
      verificarAcceso(actual, user);
      if (actual.metodo_pago !== 'TARJETA' || actual.pagado) {
        return { data: null, error: 'Solo se puede cambiar a efectivo un pedido con tarjeta que aún no está pagado', status: 409 };
      }
      if (actual.estado !== 'CREADO') {
        return { data: null, error: 'El pedido ya no admite cambiar el método de pago', status: 409 };
      }
      const pedido = await PedidoModel.updatePedido(id, { metodo_pago: 'EFECTIVO' });
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error cambiar a efectivo:');
      return errorDb(error, 'Error al cambiar el método de pago');
    }
  },

  async updateEstado(id: number, estado: EstadoPedido) {
    try {
      const actual = await obtenerPedido(id);
      validarTransicion(TRANSICIONES_PEDIDO, actual.estado, estado, 'el pedido');
      // Un pedido con tarjeta no avanza (cocina, despacho) hasta que Stripe confirme el pago; solo se puede anular.
      if (estado !== 'ANULADO' && actual.metodo_pago === 'TARJETA' && !actual.pagado) {
        return { data: null, error: 'El pedido con tarjeta aún no tiene el pago confirmado', status: 409 };
      }

      // Anular un pedido ya cobrado con tarjeta devuelve el dinero. Si el reembolso falla,
      // el pedido NO se anula (así no queda anulado y cobrado sin que nadie lo note).
      let reembolsoId: string | undefined;
      if (estado === 'ANULADO' && actual.pagado && actual.stripe_payment_id) {
        try {
          const reembolso = await stripe.refunds.create(
            { payment_intent: actual.stripe_payment_id, metadata: { pedido_id: String(id) } },
            { idempotencyKey: `reembolso-pedido:${id}` }
          );
          reembolsoId = reembolso.id;
        } catch (err) {
          logger.error({ err, pedidoId: id }, 'Error al reembolsar el pedido anulado');
          return { data: null, error: 'No se pudo reembolsar el pago; el pedido no fue anulado', status: 502 };
        }
      }

      const pedido = await PedidoModel.updatePedido(id, { estado });
      return { data: reembolsoId ? { ...pedido, reembolso_id: reembolsoId } : pedido, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error update estado pedido:');
      return errorDb(error, 'Error al actualizar estado de pedido');
    }
  },

  async marcarEntregado(id: number, user: DecodedToken) {
    try {
      const actual = await obtenerPedido(id);
      await verificarAsignacion(id, user);
      validarTransicion(TRANSICIONES_PEDIDO, actual.estado, 'ENTREGADO', 'el pedido');
      const pedido = await PedidoModel.updatePedido(id, { estado: 'ENTREGADO' });
      return { data: pedido, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error entregado pedido:');
      return errorDb(error, 'Error al marcar pedido como entregado');
    }
  },

  async incidente(id: number, motivo: string, detalle: string | undefined, user: DecodedToken) {
    try {
      const pedido = await obtenerPedido(id);
      await verificarAsignacion(id, user);
      const texto = `[INCIDENTE] ${motivo}${detalle ? ` — ${detalle}` : ''}`;
      const observaciones = (pedido.observaciones ? `${pedido.observaciones} | ${texto}` : texto)
        .slice(0, MAX_OBSERVACIONES);
      const actualizado = await PedidoModel.updatePedido(id, { observaciones });
      return { data: actualizado, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error incidente pedido:');
      return errorDb(error, 'Error al registrar el incidente');
    }
  },

  async getPedidosRepartidor(repartidorId?: number, incluirCerrados = false) {
    try {
      if (!repartidorId) {
        return { data: null, error: 'repartidor_id es requerido', status: 400 };
      }
      const hojas = await HojaDespachoModel.getByRepartidorId(repartidorId);
      const ids = [...new Set(hojas.filter(h => h.pedido_id).map(h => Number(h.pedido_id)))];
      const hojaPorPedido = new Map(hojas.map(h => [Number(h.pedido_id), Number(h.id)]));
      const pedidos: Array<Record<string, unknown>> = [];
      for (const pedidoId of ids) {
        const pedido = await PedidoModel.getPedidoId(pedidoId);
        if (!pedido) continue;
        if (!incluirCerrados && (pedido.estado === 'ENTREGADO' || pedido.estado === 'ANULADO')) continue;
        pedidos.push({ ...pedido, hoja_despacho_id: hojaPorPedido.get(pedidoId) });
      }
      return { data: pedidos, error: null, status: 200 };
    } catch (error) {
      logger.error({ err: error }, 'Error get pedidos repartidor:');
      return errorDb(error, 'Error al obtener pedidos del repartidor');
    }
  }
};
