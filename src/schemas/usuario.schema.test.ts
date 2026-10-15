import { describe, it, expect } from 'vitest';
import { schemaUsuario, schemaUsuarioUpdate } from './usuario.schema.js';

describe('schemaUsuarioUpdate (PATCH)', () => {
  it('acepta un campo parcial', () => {
    const r = schemaUsuarioUpdate.safeParse({ correo_electronico: 'nuevo@x.com' });
    expect(r.success).toBe(true);
  });

  it('acepta objeto vacío (sin cambios)', () => {
    expect(schemaUsuarioUpdate.safeParse({}).success).toBe(true);
  });

  it('acepta todos los campos válidos', () => {
    const r = schemaUsuarioUpdate.safeParse({
      usuario: 'admin2',
      correo_electronico: 'a@b.com',
      contrasenia: 'pass1234',
      rol: 'ADMIN',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza campos desconocidos (strict)', () => {
    const r = schemaUsuarioUpdate.safeParse({ campo_inexistente: 'x' });
    expect(r.success).toBe(false);
  });

  it('rechaza rol inválido', () => {
    const r = schemaUsuarioUpdate.safeParse({ rol: 'HACKER' });
    expect(r.success).toBe(false);
  });

  it('rechaza correo inválido', () => {
    const r = schemaUsuarioUpdate.safeParse({ correo_electronico: 'no-es-email' });
    expect(r.success).toBe(false);
  });

  it('rechaza contrasenia corta', () => {
    const r = schemaUsuarioUpdate.safeParse({ contrasenia: 'corta' });
    expect(r.success).toBe(false);
  });
});

describe('schemaUsuario (POST)', () => {
  it('requiere todos los campos', () => {
    const r = schemaUsuario.safeParse({ usuario: 'x' });
    expect(r.success).toBe(false);
  });

  it('acepta payload completo', () => {
    const r = schemaUsuario.safeParse({
      usuario: 'admin',
      correo_electronico: 'a@b.com',
      telefono: '55551234',
      contrasenia: 'pass1234',
      rol: 'ADMIN',
    });
    expect(r.success).toBe(true);
  });

  it('requiere telefono (la tabla lo exige y el 2FA lo usa)', () => {
    const r = schemaUsuario.safeParse({
      usuario: 'admin',
      correo_electronico: 'a@b.com',
      contrasenia: 'pass1234',
      rol: 'ADMIN',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza telefono con letras o símbolos', () => {
    const base = {
      usuario: 'admin',
      correo_electronico: 'a@b.com',
      contrasenia: 'pass1234',
      rol: 'ADMIN',
    };
    expect(schemaUsuario.safeParse({ ...base, telefono: 'abc-def' }).success).toBe(false);
    expect(schemaUsuario.safeParse({ ...base, telefono: '1234' }).success).toBe(false);
    expect(schemaUsuario.safeParse({ ...base, telefono: '555123456789012345' }).success).toBe(false);
  });
});
