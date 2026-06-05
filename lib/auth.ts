import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import * as schema from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    // Ganti dari "sqlite" ke "pg" untuk Supabase PostgreSQL
    provider: "pg",
    schema: schema,
  }),
  // Gunakan environment variable — tidak pernah hard-code di sini
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  trustedOrigins: process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  // Konfigurasi cookie agar kompatibel dengan Vercel (HTTPS)
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type Auth = typeof auth;
