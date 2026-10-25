import { describe, it, expect } from 'vitest';
import { VISTAS_POR_ROL, vistasDe } from './vistas.js';
import { rolUsuarioEnum } from '../schemas/db.schema.js';

describe('vistas por rol', () => {
  it('todos los roles de la base de datos tienen vistas definidas (más CLIENTE)', () => {
    for (const rol of rolUsuarioEnum.enumValues) {
      expect(VISTAS_POR_ROL[rol].length, rol).toBeGreaterThan(0);
    }
    expect(VISTAS_POR_ROL.CLIENTE.length).toBeGreaterThan(0);
  });

  it('el repartidor solo ve su vista, sus pedidos asignados y sus liquidaciones', () => {
    expect(vistasDe('REPARTIDOR')).toEqual(['repartidor', 'pedidos-asignados', 'liquidaciones']);
  });

  it('un rol sin permisos de administración no ve vistas de administración', () => {
    for (const rol of ['REPARTIDOR', 'CAJERO', 'COCINERO', 'BODEGUERO', 'CLIENTE']) {
      expect(vistasDe(rol), rol).not.toContain('usuarios');
      expect(vistasDe(rol), rol).not.toContain('reportes');
    }
  });

  it('solo el ADMIN gestiona usuarios; solo ADMIN/GERENTE ven reportes', () => {
    const conUsuarios = Object.keys(VISTAS_POR_ROL).filter(r => vistasDe(r).includes('usuarios'));
    expect(conUsuarios).toEqual(['ADMIN']);
    const conReportes = Object.keys(VISTAS_POR_ROL).filter(r => vistasDe(r).includes('reportes'));
    expect(conReportes.sort()).toEqual(['ADMIN', 'GERENTE']);
  });

  it('un rol desconocido o vacío no ve nada, y la lista devuelta es una copia', () => {
    expect(vistasDe('INVENTADO')).toEqual([]);
    expect(vistasDe(undefined)).toEqual([]);
    vistasDe('CAJERO').push('hack');
    expect(vistasDe('CAJERO')).not.toContain('hack');
  });
});
