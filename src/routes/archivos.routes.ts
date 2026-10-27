import { Router, type Request, type Response } from 'express';
import { ArchivosController } from '../controllers/archivos.controller.js';
import { validate } from '../middleware/validate.js';
import { schemaUploadUrl } from '../schemas/archivo.schema.js';
import { authenticate, staffOnly } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /archivos/imagen:
 *   get:
 *     summary: Ver una imagen del catálogo (redirige a una URL firmada de 15 minutos)
 *     description: El bucket de S3 es privado; las URLs directas de las imágenes responden 403. El frontend usa este endpoint público, limitado a la carpeta productos/.
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: productos/combos/Combo Bacon.jpg
 *     responses:
 *       302:
 *         description: Redirección a la imagen (URL firmada)
 *       400:
 *         description: Clave inválida (fuera de productos/ o sin extensión de imagen)
 */
router.get('/imagen', async (req: Request, res: Response) => {
  const key = Array.isArray(req.query.key) ? undefined : req.query.key;
  const result = await ArchivosController.getImagenUrl(key);
  if (result.status !== 200 || typeof result.data !== 'string') {
    res.status(result.status).json({ data: null, error: result.error });
    return;
  }
  // La imagen la carga un <img> de otro origen (el frontend): helmet pone same-origin por defecto.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Se cachea menos que la vigencia de la firma (900 s) para no entregar redirecciones vencidas.
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.redirect(302, result.data);
});

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
 *             required: [fileName, fileType]
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: hamburguesa-doble.png
 *               fileType:
 *                 type: string
 *                 enum: [image/png, image/jpeg, image/jpg, image/gif, image/webp]
 *                 example: image/png
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
