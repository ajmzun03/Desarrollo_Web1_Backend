import { uploadFile, urlDeLectura, type ContentType } from '../services/s3.js';
import { errorDb } from '../utils/errors.js';
import logger from '../config/logger.js';

// Solo se sirven imágenes del catálogo: carpeta "productos/" y extensiones de imagen. Esto evita que el
// endpoint público se use para leer cualquier otro objeto del bucket.
const PREFIJO_PERMITIDO = 'productos/';
const EXTENSIONES_IMAGEN = /\.(jpe?g|png|webp|gif)$/i;

/** true si la clave apunta a una imagen del catálogo y no intenta salirse de la carpeta. */
export function claveDeImagenValida(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.length > PREFIJO_PERMITIDO.length &&
    key.length <= 300 &&
    key.startsWith(PREFIJO_PERMITIDO) &&
    !key.includes('..') &&
    !key.includes('\\') &&
    !key.includes('//') &&
    !/[\x00-\x1f]/.test(key) &&
    EXTENSIONES_IMAGEN.test(key)
  );
}

export const ArchivosController = {
  /** URL firmada (15 min) para ver una imagen del catálogo. */
  async getImagenUrl(key: unknown) {
    if (!claveDeImagenValida(key)) {
      return { data: null, error: 'Imagen no válida', status: 400 };
    }
    try {
      return { data: await urlDeLectura(key), error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al firmar la URL de lectura de S3');
      return errorDb(error, 'Error al obtener la imagen');
    }
  },

  async getUploadUrl(fileName: string, fileType: string, fileSize?: number) {
    try {
      if (!fileName || !fileType) {
        return { data: null, error: 'fileName y fileType son requeridos', status: 400 };
      }

      const result = await uploadFile(fileName, fileType as ContentType, fileSize);
      return { data: result, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ err: error }, 'Error al generar presigned URL para S3');
      return errorDb(error, 'Error al generar URL de subida');
    }
  }
};
