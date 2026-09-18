import { Router } from 'express';
import { MunicipiosController } from '../controllers/municipios.controller.js';
const router = Router();
/**
 * @openapi
 * /municipios:
 *   get:
 *     summary: Listar municipios, opcionalmente filtrados por departamento
 *     tags: [Municipios]
 *     parameters:
 *       - in: query
 *         name: departamento_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID del departamento para filtrar los municipios
 *     responses:
 *       200:
 *         description: Lista de municipios
 *       500:
 *         description: Error al obtener municipios
 */
// GET /municipios?departamento_id= — público (dato semilla)
router.get('/', async (req, res) => {
    const departamentoId = req.query.departamento_id ? Number(req.query.departamento_id) : undefined;
    const result = await MunicipiosController.getAll(departamentoId);
    res.status(result.status).json({ data: result.data, error: result.error });
});
/**
 * @openapi
 * /municipios/departamentos:
 *   get:
 *     summary: Listar todos los departamentos
 *     tags: [Municipios]
 *     responses:
 *       200:
 *         description: Lista de departamentos
 *       500:
 *         description: Error al obtener departamentos
 */
// GET /departamentos — público (dato semilla)
router.get('/departamentos', async (_req, res) => {
    const result = await MunicipiosController.getDepartamentos();
    res.status(result.status).json({ data: result.data, error: result.error });
});
export default router;
//# sourceMappingURL=municipios.routes.js.map