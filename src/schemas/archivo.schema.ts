import z from 'zod'
import { ContentType } from '../services/s3.js';

const ContentTypeValues = Object.values(ContentType)

export const schemaUploadUrl = z.object({
  fileName: z.string('El nombre del archivo es requerido').min(1, 'El nombre del archivo no puede estar vacío'),
  fileType: z.enum(ContentTypeValues, { message: 'Tipo de archivo no permitido. Solo se aceptan imágenes (PNG, JPEG, JPG, GIF, WEBP)' }
  )
});

export function validateUploadUrl(object: unknown) {
  return schemaUploadUrl.safeParse(object);
}
