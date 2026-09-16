import { Router } from 'express';
import { db } from '../model/supabase/db.model.js';
import { municipioTable, departamentoTable } from '../schemas/db.schema.js';
import { eq } from 'drizzle-orm';
const router = Router();
// GET /municipios
router.get('/', async (_req, res) => {
    try {
        const { departamento_id } = _req.query;
        let municipios;
        if (departamento_id) {
            municipios = await db.select().from(municipioTable).where(eq(municipioTable.departamento_id, Number(departamento_id)));
        }
        else {
            municipios = await db.select().from(municipioTable).limit(100).offset(0);
        }
        res.json({ data: municipios, error: null });
    }
    catch (error) {
        console.error('Error get municipios:', error);
        res.status(500).json({ data: null, error: 'Error al obtener municipios' });
    }
});
// GET /departamentos
router.get('/departamentos', async (_req, res) => {
    try {
        const departamentos = await db.select().from(departamentoTable).limit(100).offset(0);
        res.json({ data: departamentos, error: null });
    }
    catch (error) {
        console.error('Error get departamentos:', error);
        res.status(500).json({ data: null, error: 'Error al obtener departamentos' });
    }
});
export default router;
//# sourceMappingURL=municipios.routes.js.map