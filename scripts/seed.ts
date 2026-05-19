import { config } from "dotenv";
// Load .env.local agar DATABASE_URL tersedia saat menjalankan script via npm
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

const SERVICES = [
  { id: "srv-1", nama: "Service Ringan", deskripsi: "Pengecekan standar, pembersihan karburator/injeksi, setel rantai, rem, dll.", hargaEstimasi: 100000 },
  { id: "srv-2", nama: "Service Besar", deskripsi: "Turun mesin sebagian, skir klep, pembersihan kerak piston, ganti paking, dll.", hargaEstimasi: 350000 },
  { id: "srv-3", nama: "Ganti Oli", deskripsi: "Jasa penggantian oli mesin dan oli gardan (jika matic).", hargaEstimasi: 25000 },
  { id: "srv-4", nama: "Tune Up", deskripsi: "Penyetelan klep, pembersihan throttle body, cek kelistrikan, ganti filter.", hargaEstimasi: 150000 },
];

const SPAREPARTS = [
  { id: "sp-1", nama: "Kampas Rem Depan Bendix", kode: "BRK-BNDX-N250", kategori: "Pengereman", harga: 85000, stok: 20, kompatibilitas: JSON.stringify(["Kawasaki Ninja 250", "Universal"]), imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600" },
  { id: "sp-2", nama: "Filter Udara K&N", kode: "FIL-KN-Z250", kategori: "Mesin", harga: 350000, stok: 5, kompatibilitas: JSON.stringify(["Kawasaki Z250", "Kawasaki Ninja 250"]), imageUrl: "https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&q=80&w=600" },
  { id: "sp-3", nama: "Busi NGK Iridium", kode: "SPK-NGK-IRD", kategori: "Pengapian", harga: 120000, stok: 15, kompatibilitas: JSON.stringify(["Universal"]), imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600" },
  { id: "sp-4", nama: "V-Belt KTC", kode: "VBT-KTC-MAT", kategori: "Transmisi", harga: 180000, stok: 10, kompatibilitas: JSON.stringify(["Matic Universal"]), imageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600" },
  { id: "sp-5", nama: "Gear Set SSS", kode: "GER-SSS-KLX", kategori: "Transmisi", harga: 300000, stok: 8, kompatibilitas: JSON.stringify(["Kawasaki KLX 150"]), imageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600" },
];

const OILS = [
  { id: "oil-1", nama: "Kawasaki Genuine Oil 4T", merek: "Kawasaki", tipeTransmisi: "Manual", viskositas: "10W-40", ccMin: 150, ccMax: 1000, harga: 95000, gradeApi: "SN", rating: 4.8 },
  { id: "oil-2", nama: "Motul 5100", merek: "Motul", tipeTransmisi: "Manual", viskositas: "10W-40", ccMin: 150, ccMax: 1000, harga: 185000, gradeApi: "SP", rating: 4.9 },
  { id: "oil-3", nama: "Enduro Racing 4T", merek: "Pertamina", tipeTransmisi: "Manual", viskositas: "10W-40", ccMin: 100, ccMax: 250, harga: 45000, gradeApi: "SL", rating: 4.5 },
  { id: "oil-4", nama: "Motul Scooter LE", merek: "Motul", tipeTransmisi: "Matic", viskositas: "10W-30", ccMin: 110, ccMax: 250, harga: 85000, gradeApi: "SN", rating: 4.7 },
  { id: "oil-5", nama: "Federal Matic", merek: "Federal", tipeTransmisi: "Matic", viskositas: "10W-40", ccMin: 110, ccMax: 150, harga: 42000, gradeApi: "SL", rating: 4.6 },
  { id: "oil-6", nama: "Shell Advance AX7", merek: "Shell", tipeTransmisi: "Manual", viskositas: "10W-40", ccMin: 150, ccMax: 400, harga: 75000, gradeApi: "SN", rating: 4.7 },
  { id: "oil-7", nama: "Castrol Power1 Matic", merek: "Castrol", tipeTransmisi: "Matic", viskositas: "10W-40", ccMin: 110, ccMax: 150, harga: 48000, gradeApi: "SL", rating: 4.4 },
];

async function seed() {
  console.log("🌱 Starting Database Seeding ke Supabase PostgreSQL...");

  // 1. Seed Services
  console.log("➡️ Seeding Services...");
  for (const srv of SERVICES) {
    await db.insert(schema.jenisService).values(srv).onConflictDoUpdate({
      target: schema.jenisService.id,
      set: { nama: srv.nama, deskripsi: srv.deskripsi, hargaEstimasi: srv.hargaEstimasi },
    });
  }

  // 2. Seed Spareparts
  console.log("➡️ Seeding Spareparts...");
  for (const part of SPAREPARTS) {
    await db.insert(schema.spareparts).values(part).onConflictDoUpdate({
      target: schema.spareparts.id,
      set: { nama: part.nama, kode: part.kode, kategori: part.kategori, harga: part.harga, stok: part.stok, kompatibilitas: part.kompatibilitas, imageUrl: part.imageUrl },
    });
  }

  // 3. Seed Oils
  console.log("➡️ Seeding Oils...");
  for (const oil of OILS) {
    await db.insert(schema.oli).values(oil).onConflictDoUpdate({
      target: schema.oli.id,
      set: { nama: oil.nama, merek: oil.merek, tipeTransmisi: oil.tipeTransmisi, viskositas: oil.viskositas, ccMin: oil.ccMin, ccMax: oil.ccMax, harga: oil.harga, gradeApi: oil.gradeApi, rating: oil.rating },
    });
  }

  console.log("🎉 Database Supabase Seeded Successfully!");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
