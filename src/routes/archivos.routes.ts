import { Router, type Request, type Response } from 'express';
import { ArchivosController } from '../controllers/archivos.controller.js';
import { validate } from '../middleware/validate.js';
import { schemaUploadUrl } from '../schemas/archivo.schema.js';
import { authenticate, staffOnly } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /archivos/upload-url:
 *   post:
 *     summary: Obtener URL prefirmada de AWS S3 para subir un archivo
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, fileType, fileSize]
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: hamburguesa-doble.png
 *               fileType:
 *                 type: string
 *                 enum: [image/png, image/jpeg, image/jpg, image/gif, image/webp]
 *                 example: image/png
 *               fileSize:
 *                 type: integer
 *                 description: Tamaño en bytes (máx. 5 MB). Se firma en la URL.
 *                 example: 204800
 *     responses:
 *       200:
 *         description: URL prefirmada generada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadUrl:
 *                       type: string
 *                       description: URL prefirmada PUT para subir a S3
 *                     fileKey:
 *                       type: string
 *                       description: Clave del objeto en S3
 *                     finalUrl:
 *                       type: string
 *                       description: URL pública final de la imagen en S3
 *       400:
 *         description: Datos inválidos o tipo de archivo no permitido
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/upload-url', authenticate, staffOnly, validate(schemaUploadUrl), async (req: Request, res: Response) => {
  const { fileName, fileType, fileSize } = req.body;
  const result = await ArchivosController.getUploadUrl(fileName, fileType, fileSize);
  res.status(result.status).json({ data: result.data, error: result.error });
});

export default router;
