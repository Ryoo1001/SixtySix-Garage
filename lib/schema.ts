import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

// ==========================================
// 🛡️ BETTER AUTH REQUIREMENT SCHEMAS
// Menggunakan tipe PostgreSQL (pgTable + timestamp + boolean)
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  phone: text("phone"),
  role: text("role").default("user"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// ==========================================
// 🏍️ SixtySixGarage BUSINESS SCHEMAS
// Menggunakan tipe PostgreSQL (integer untuk timestamps aplikasi)
// ==========================================

export const kendaraan = pgTable("kendaraan", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  jenis: text("jenis").notNull().default("Motor"),
  transmisi: text("transmisi").notNull(),
  merek: text("merek").notNull(),
  model: text("model").notNull(),
  tahun: integer("tahun"),
  cc: integer("cc").notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kendaraanId: text("kendaraanId")
    .notNull()
    .references(() => kendaraan.id),
  tanggal: text("tanggal").notNull(),
  waktu: text("waktu").notNull(),
  status: text("status").notNull().default("Pending"),
  catatan: text("catatan"),
  createdAt: integer("createdAt").notNull(),
});

export const jenisService = pgTable("jenis_service", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  hargaEstimasi: integer("harga_estimasi").notNull(),
});

export const bookingServices = pgTable("booking_services", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: text("serviceId")
    .notNull()
    .references(() => jenisService.id),
});

export const spareparts = pgTable("spareparts", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull(),
  kategori: text("kategori"),
  harga: integer("harga").notNull(),
  stok: integer("stok").notNull().default(0),
  kompatibilitas: text("kompatibilitas"),
  imageUrl: text("image_url"),
});

export const bookingSpareparts = pgTable("booking_spareparts", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  sparepartId: text("sparepartId")
    .notNull()
    .references(() => spareparts.id),
  qty: integer("qty").notNull(),
  hargaSaatBooking: integer("harga_saat_booking").notNull(),
});

export const oli = pgTable("oli", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  merek: text("merek").notNull(),
  tipeTransmisi: text("tipe_transmisi").notNull(),
  viskositas: text("viskositas").notNull(),
  ccMin: integer("cc_min").notNull().default(0),
  ccMax: integer("cc_max").notNull().default(9999),
  harga: integer("harga").notNull(),
  gradeApi: text("grade_api"),
  rating: real("rating"),
});

export const bookingOli = pgTable("booking_oli", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  oliId: text("oliId")
    .notNull()
    .references(() => oli.id),
  hargaSaatBooking: integer("harga_saat_booking").notNull(),
});

export const dailySlots = pgTable("daily_slots", {
  id: text("id").primaryKey(),
  tanggal: text("tanggal").notNull().unique(),
  kapasitasMax: integer("kapasitas_max").notNull().default(5),
  kapasitasTerpakai: integer("kapasitas_terpakai").notNull().default(0),
  status: text("status").notNull().default("Open"),
});
