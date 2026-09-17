import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { supabaseUrl } from '../../config.js';

const client = postgres(supabaseUrl);

// Pasa 'client' dentro de un objeto
export const db = drizzle({ client });