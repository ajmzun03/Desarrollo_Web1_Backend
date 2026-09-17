import { db } from "./db.model.js";
import { municipioTable } from "../../schemas/db.schema.js";
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
export const MunicipioModel = {
    async getAll() {
        const municipios = await db.select().from(municipioTable).limit(100).offset(0);
        if (municipios.length === 0) {
            logger.warn("No se encontraron municipios");
            throw new Error("No se encontraron municipios");
        }
        logger.info(`Se encontraron ${municipios.length} municipios`);
        return municipios;
    },
    async getById(id) {
        const municipio = await db.select().from(municipioTable).where(eq(municipioTable.id, id));
        if (!municipio[0]) {
            logger.warn(`Municipio con id ${id} no encontrado`);
            throw new Error("Municipio no encontrado");
        }
        logger.info(`Municipio con id ${id} encontrado`);
        return municipio[0] || null;
    }
};
//# sourceMappingURL=municipio.model.js.map