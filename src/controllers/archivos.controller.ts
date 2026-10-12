import { uploadFile, type ContentType } from '../services/s3.js';
import logger from '../config/logger.js';

export const ArchivosController = {
  async getUploadUrl(fileName: string, fileType: string) {
    try {
      if (!fileName || !fileType) {
        return { data: null, error: 'fileName y fileType son requeridos', status: 400 };
      }

      const result = await uploadFile(fileName, fileType as ContentType);
      return { data: result, error: null, status: 200 };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al generar presigned URL para S3');
      return { data: null, error: 'Error al generar URL de subida', status: 500 };
    }
  }
};
