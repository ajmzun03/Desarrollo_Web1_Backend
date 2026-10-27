import z from 'zod'
import { ContentType, MAX_UPLOAD_BYTES } from '../services/s3.js';

const ContentTypeValues = Object.values(ContentType)

export const schemaUploadUrl = z.object({
  fileName: z.string('El nombre del archivo es requerido').min(1, 'El nombre del archivo no puede estar vacío').max(150, 'El nombre del archivo no puede tener más de 150 caracteres'),
  // Obligatorio: se firma en la URL y S3 rechaza archivos de otro tamaño (máx. 5 MB)
  fileSize: z.number('El tamaño del archivo es requerido').int().positive().max(MAX_UPLOAD_BYTES, 'El archivo no puede pesar más de 5 MB'),
  fileType: z.enum(ContentTypeValues, { message: 'Tipo de archivo no permitido. Solo se aceptan imágenes (PNG, JPEG, JPG, GIF, WEBP)' }
  )
});

export function validateUploadUrl(object: unknown) {
  return schemaUploadUrl.safeParse(object);
}
