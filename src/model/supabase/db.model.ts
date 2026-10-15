import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgAsyncDatabase } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { supabaseUrl } from '../../config.js';

const client = postgres(supabaseUrl);

// Pasa 'client' dentro de un objeto
export const db = drizzle({ client });

/**
 * Executor de Drizzle: `db` o un `tx` de db.transaction().
 * Los models aceptan uno opcional para ejecutar dentro de transacciones.
 * `PgAsyncDatabase` es la base común de PostgresJsDatabase (db) y
 * PostgresJsTransaction (tx), evitando el requerimiento de $client.
 */
export type Tx = PgAsyncDatabase<PostgresJsQueryResultHKT, any>;