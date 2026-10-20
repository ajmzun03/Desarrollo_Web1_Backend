import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgAsyncDatabase } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { supabaseUrl } from '../../config.js';

// prepare:false es necesario con el pooler de Supabase en modo transacción (puerto 6543)
const client = postgres(supabaseUrl, { prepare: false, max: 10, idle_timeout: 20 });

export const sql = client;

// Pasa 'client' dentro de un objeto
export const db = drizzle({ client });

/**
 * Executor de Drizzle: `db` o un `tx` de db.transaction().
 * Los models aceptan uno opcional para ejecutar dentro de transacciones.
 * `PgAsyncDatabase` es la base común de PostgresJsDatabase (db) y
 * PostgresJsTransaction (tx), evitando el requerimiento de $client.
 */
export type Tx = PgAsyncDatabase<PostgresJsQueryResultHKT, any>;