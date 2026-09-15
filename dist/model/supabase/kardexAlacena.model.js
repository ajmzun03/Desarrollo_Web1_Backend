import { kardexAlacenaTable } from "../../schemas/index.schema.js";
import { eq, ColumnAliasProxyHandler } from "drizzle-orm";
import { db } from "./db.model.js";
export const KardexAlacenaModel = {
    async getKardexAlacenaById(id, lote) {
        try {
            const kardexAlacena = await db.select().from(kardexAlacenaTable).where(and(eq(kardexAlacenaTable.id, id), eq(kardexAlacenaTable.lote_id, lote)));
        }
        catch () {
        }
    }
};
//# sourceMappingURL=kardexAlacena.model.js.map