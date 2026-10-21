import { describe, it, expect, vi } from 'vitest';

vi.mock('../model/supabase/db.model.js', () => ({ db: {}, Tx: {} as never }));

import { tienePedido, tieneCliente, tieneDireccion, esRepartidor, exigirAsignado, type AsignacionRepartidor } from './asignaciones.service.js';

const asig: AsignacionRepartidor[] = [
  { pedido_id: 10, cliente_id: 3, direccion_id: 7, estado: 'EN_RUTA' },
  { pedido_id: 11, cliente_id: 4, direccion_id: null, estado: 'EN_RUTA' },
];

describe('asignaciones del repartidor', () => {
  it('reconoce los pedidos, clientes y direcciones asignados', () => {
    expect(tienePedido(asig, 10)).toBe(true);
    expect(tienePedido(asig, 99)).toBe(false);
    expect(tieneCliente(asig, 4)).toBe(true);
    expect(tieneCliente(asig, 1)).toBe(false);
    expect(tieneDireccion(asig, 7)).toBe(true);
    expect(tieneDireccion(asig, 8)).toBe(false);
  });

  it('un pedido sin dirección no habilita ninguna dirección', () => {
    expect(tieneDireccion([{ pedido_id: 1, cliente_id: 1, direccion_id: null, estado: 'X' }], 0)).toBe(false);
  });

  it('esRepartidor solo es verdadero para el rol REPARTIDOR', () => {
    expect(esRepartidor({ id: '1', rol: 'REPARTIDOR' } as never)).toBe(true);
    expect(esRepartidor({ id: '1', rol: 'ADMIN' } as never)).toBe(false);
    expect(esRepartidor(undefined)).toBe(false);
  });

  it('exigirAsignado no restringe a quienes no son repartidores (ya los resolvió el middleware)', async () => {
    await expect(exigirAsignado({ id: '1', rol: 'ADMIN' } as never, 'cliente', 123)).resolves.toBeUndefined();
    await expect(exigirAsignado({ id: '9', rol: 'CLIENTE', tipo: 'cliente' } as never, 'pedido', 123)).resolves.toBeUndefined();
  });
});
