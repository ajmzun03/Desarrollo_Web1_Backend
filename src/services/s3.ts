import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME } from '../config.js'

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export enum ContentType {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  GIF = 'image/gif',
  WEBP = 'image/webp'
}

/** Tamaño máximo de una imagen subida (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const uploadFile = async (fileName: string, fileType: ContentType | string, fileSize?: number) => {
  // Nombre único y sin caracteres peligrosos (rutas, espacios, unicode raro) para la clave del objeto
  const nombreSeguro = fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+/, '')
    .slice(-80) || 'archivo';
  const fileKey = `uploads/${Date.now()}-${randomUUID().slice(0, 8)}-${nombreSeguro}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    // Con el tamaño firmado en la URL, S3 rechaza un PUT con un cuerpo de otro tamaño
    ...(fileSize ? { ContentLength: fileSize } : {})
  });

  // Genera una URL que vence en 5 minutos (300 segundos)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    fileKey,
    finalUrl: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`
  }
} 
/** Vigencia de la URL firmada de lectura (segundos). */
export const LECTURA_EXPIRA_SEGUNDOS = 900;

/**
 * URL firmada de corta vida para LEER un objeto del bucket. El bucket es privado (las URLs directas
 * responden 403), así que las imágenes se sirven por aquí.
 */
export const urlDeLectura = async (key: string): Promise<string> =>
  getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: LECTURA_EXPIRA_SEGUNDOS });
