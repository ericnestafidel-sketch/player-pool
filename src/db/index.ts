import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Database = NeonDatabase<typeof schema>;

let pool: Pool | null = null;
let database: Database | null = null;

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!database) {
    pool = new Pool({ connectionString: url });
    database = drizzle(pool, { schema });
  }
  return database;
}
