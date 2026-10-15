import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export const uploadFile = async (fileName: string, fileType: ContentType | string) => {
  // Generar un nombre único para evitar sobreescribir archivos existentes
  const fileKey = `uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  // Genera una URL que vence en 5 minutos (300 segundos)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    fileKey,
    finalUrl: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`
  }
} 