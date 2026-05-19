import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local untuk drizzle-kit CLI (tidak otomatis dibaca oleh drizzle-kit)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
