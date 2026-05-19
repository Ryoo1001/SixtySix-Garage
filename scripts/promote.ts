import { config } from "dotenv";
// Load .env.local agar DATABASE_URL tersedia saat menjalankan script via npm
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error("Silakan masukkan alamat email yang ingin dijadikan admin!");
    console.error("Contoh penggunaan: npx tsx scripts/promote.ts email@anda.com");
    process.exit(1);
  }

  console.log(`🔍 Mencari akun dengan email: ${email}...`);
  const foundUser = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });

  if (!foundUser) {
    console.error(`❌ Akun dengan email ${email} tidak ditemukan di database!`);
    console.error("Silakan daftar akun terlebih dahulu via website.");
    process.exit(1);
  }

  console.log(`➡️ Mempromosikan akun "${foundUser.name}" menjadi 'admin'...`);
  await db.update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.email, email));

  console.log(`🎉 Berhasil! Akun "${foundUser.name}" sekarang memiliki peran 'admin'!`);
  await client.end();
  process.exit(0);
}

promote().catch((err) => {
  console.error("❌ Gagal menjalankan promote:", err);
  process.exit(1);
});
