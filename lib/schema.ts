import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ==========================================
// 🛡️ BETTER AUTH REQUIREMENT SCHEMAS
// ==========================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
  phone: text("phone"), // Custom field mapped
  role: text("role").default("user"), // user / admin
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: integer("expiresAt"),
  password: text("password"),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt").notNull(),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

// ==========================================
// 🏍️ SixtySixGarage BUSINESS SCHEMAS
// ==========================================

export const kendaraan = sqliteTable("kendaraan", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  jenis: text("jenis").notNull().default("Motor"),
  transmisi: text("transmisi").notNull(), // Matic / Manual
  merek: text("merek").notNull(), // Kawasaki, Yamaha, Honda, dll.
  model: text("model").notNull(), // Ninja 250, KLX 150, dll.
  tahun: integer("tahun"),
  cc: integer("cc").notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  kendaraanId: text("kendaraanId").notNull().references(() => kendaraan.id),
  tanggal: text("tanggal").notNull(), // YYYY-MM-DD
  waktu: text("waktu").notNull(), // e.g., "09:00", "13:00"
  status: text("status").notNull().default("Pending"), // Pending, Confirmed, Cancelled, Completed
  catatan: text("catatan"),
  createdAt: integer("createdAt").notNull(),
});

export const jenisService = sqliteTable("jenis_service", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  hargaEstimasi: integer("harga_estimasi").notNull(),
});

export const bookingServices = sqliteTable("booking_services", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: text("serviceId").notNull().references(() => jenisService.id),
});

export const spareparts = sqliteTable("spareparts", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull(),
  kategori: text("kategori"),
  harga: integer("harga").notNull(),
  stok: integer("stok").notNull().default(0),
  kompatibilitas: text("kompatibilitas"), // JSON string array: ["Ninja 250", "Z250"]
  imageUrl: text("image_url"),
});

export const bookingSpareparts = sqliteTable("booking_spareparts", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  sparepartId: text("sparepartId").notNull().references(() => spareparts.id),
  qty: integer("qty").notNull(),
  hargaSaatBooking: integer("harga_saat_booking").notNull(),
});

export const oli = sqliteTable("oli", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  merek: text("merek").notNull(),
  tipeTransmisi: text("tipe_transmisi").notNull(), // Matic / Manual / Both
  viskositas: text("viskositas").notNull(),
  ccMin: integer("cc_min").notNull().default(0),
  ccMax: integer("cc_max").notNull().default(9999),
  harga: integer("harga").notNull(),
  gradeApi: text("grade_api"), // SL, SM, SN, SP
  rating: real("rating"), // 1.0 - 5.0
});

export const bookingOli = sqliteTable("booking_oli", {
  id: text("id").primaryKey(),
  bookingId: text("bookingId").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  oliId: text("oliId").notNull().references(() => oli.id),
  hargaSaatBooking: integer("harga_saat_booking").notNull(),
});

export const dailySlots = sqliteTable("daily_slots", {
  id: text("id").primaryKey(),
  tanggal: text("tanggal").notNull().unique(), // YYYY-MM-DD
  kapasitasMax: integer("kapasitas_max").notNull().default(5),
  kapasitasTerpakai: integer("kapasitas_terpakai").notNull().default(0),
  status: text("status").notNull().default("Open"), // Open, Closed
});
