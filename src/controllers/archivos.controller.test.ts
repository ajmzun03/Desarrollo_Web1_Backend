import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/s3.js', () => ({
  uploadFile: vi.fn(),
  urlDeLectura: vi.fn(),
}));

import { ArchivosController, claveDeImagenValida } from './archivos.controller.js';
import { urlDeLectura } from '../services/s3.js';

const mockFirmar = vi.mocked(urlDeLectura, true);

describe('claveDeImagenValida', () => {
  it.each([
    'productos/combos/Combo Bacon Chapín - Hamburguesa.jpg',
    'productos/acompañamientos/Aros de Cebolla.jpeg',
    'productos/bebidas/Limonada.PNG',
    'productos/postres/Helado.webp',
    'productos/x.gif',
  ])('acepta una imagen del catálogo: %s', (key) => {
    expect(claveDeImagenValida(key)).toBe(true);
  });

  it.each([
    ['otra carpeta del bucket', 'uploads/123-foto.jpg'],
    ['salir de la carpeta con ..', 'productos/../uploads/secreto.jpg'],
    ['ruta absoluta', '/productos/a.jpg'],
    ['barra invertida', 'productos\\a.jpg'],
    ['doble barra', 'productos//a.jpg'],
    ['extensión que no es imagen', 'productos/lista-de-precios.pdf'],
    ['sin extensión', 'productos/archivo'],
    ['solo el prefijo', 'productos/'],
    ['vacía', ''],
    ['caracteres de control', 'productos/a\u0000.jpg'],
    ['demasiado larga', 'productos/' + 'a'.repeat(300) + '.jpg'],
  ])('rechaza %s', (_motivo, key) => {
    expect(claveDeImagenValida(key)).toBe(false);
  });

  it('rechaza valores que no son texto', () => {
    expect(claveDeImagenValida(undefined)).toBe(false);
    expect(claveDeImagenValida(['productos/a.jpg'])).toBe(false);
    expect(claveDeImagenValida(42)).toBe(false);
  });
});

describe('ArchivosController.getImagenUrl', () => {
  beforeEach(() => vi.resetAllMocks());

  it('devuelve 400 sin llamar a S3 si la clave no es válida', async () => {
    const r = await ArchivosController.getImagenUrl('uploads/secreto.jpg');
    expect(r.status).toBe(400);
    expect(mockFirmar).not.toHaveBeenCalled();
  });

  it('devuelve la URL firmada de la imagen', async () => {
    mockFirmar.mockResolvedValueOnce('https://umg-bucket.s3.amazonaws.com/productos/a.jpg?X-Amz-Signature=abc');
    const r = await ArchivosController.getImagenUrl('productos/a.jpg');
    expect(r.status).toBe(200);
    expect(r.data).toContain('X-Amz-Signature');
    expect(mockFirmar).toHaveBeenCalledWith('productos/a.jpg');
  });

  it('devuelve error del servidor si S3 falla', async () => {
    mockFirmar.mockRejectedValueOnce(new Error('AccessDenied'));
    const r = await ArchivosController.getImagenUrl('productos/a.jpg');
    expect(r.status).toBeGreaterThanOrEqual(500);
  });
});
