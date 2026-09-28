import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create Neon database connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle database instance with Neon
export const db = drizzle(sql, { schema });
