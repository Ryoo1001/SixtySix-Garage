import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Koneksi ke Supabase PostgreSQL
const client = postgres(process.env.DATABASE_URL!, {
  // Matikan prefetch agar kompatibel dengan Supabase Transaction Pooler (serverless)
  prepare: false,
});

export const db = drizzle(client, { schema });
