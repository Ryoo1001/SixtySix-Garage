import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Helper generator ID sederhana
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

// GET /api/bookings
// Mengambil riwayat booking lengkap untuk pengguna aktif yang sedang login
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const { searchParams } = new URL(req.url);
    const isAll = searchParams.get("all") === "true";

    if (!isAll && (!session || !session.user)) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum masuk (Unauthorized)" }, { status: 401 });
    }

    const userId = session?.user?.id;

    // Ambil semua booking milik user (atau semua booking jika Admin)
    const userBookings = await db.query.bookings.findMany({
      where: isAll ? undefined : eq(schema.bookings.userId, userId as string),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });

    // Join data terkait secara manual atau menggunakan query builder agar efisien
    const detailedBookings = await Promise.all(
      userBookings.map(async (booking) => {
        // Ambil info kendaraan
        const v = await db.query.kendaraan.findFirst({
          where: eq(schema.kendaraan.id, booking.kendaraanId),
        });

        // Ambil info jasa service
        const bServices = await db.select()
          .from(schema.bookingServices)
          .where(eq(schema.bookingServices.bookingId, booking.id));
        const services = await Promise.all(
          bServices.map(async (bs) => {
            return db.query.jenisService.findFirst({
              where: eq(schema.jenisService.id, bs.serviceId),
            });
          })
        );

        // Ambil info spareparts
        const bParts = await db.select()
          .from(schema.bookingSpareparts)
          .where(eq(schema.bookingSpareparts.bookingId, booking.id));
        const spareparts = await Promise.all(
          bParts.map(async (bp) => {
            const p = await db.query.spareparts.findFirst({
              where: eq(schema.spareparts.id, bp.sparepartId),
            });
            return {
              ...p,
              qty: bp.qty,
              hargaSaatBooking: bp.hargaSaatBooking,
            };
          })
        );

        // Ambil info oli
        const bOil = await db.query.bookingOli.findFirst({
          where: eq(schema.bookingOli.bookingId, booking.id),
        });
        let oil = null;
        if (bOil) {
          const o = await db.query.oli.findFirst({
            where: eq(schema.oli.id, bOil.oliId),
          });
          oil = {
            ...o,
            hargaSaatBooking: bOil.hargaSaatBooking,
          };
        }

        return {
          ...booking,
          kendaraan: v,
          services: services.filter(Boolean),
          spareparts: spareparts.filter(Boolean),
          oil,
        };
      })
    );

    return NextResponse.json(detailedBookings);
  } catch (error) {
    console.error("Error in GET /api/bookings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/bookings
// Membuat transaksi booking service baru
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum masuk (Unauthorized)" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      brand,
      model,
      transmission,
      cc,
      date,
      timeSlot,
      notes,
      services, // Array string ID jasa service: ["srv-1", "srv-3"]
      cart,     // Array suku cadang: [{ item: { id: "sp-1" }, qty: 1 }]
      selectedOil // Objek oli: { id: "oil-1", harga: 95000 } atau null
    } = body;

    // Validasi input wajib
    if (!brand || !transmission || !cc || !date || !timeSlot || !services || services.length === 0) {
      return NextResponse.json({ error: "Formulir booking tidak lengkap" }, { status: 400 });
    }

    // Eksekusi transaksi database secara atomik
    const result = await db.transaction(async (tx) => {
      // 1. Verifikasi slot harian dan kapasitas (Maksimal kuota default 5)
      let slot = await tx.query.dailySlots.findFirst({
        where: eq(schema.dailySlots.tanggal, date),
      });

      if (!slot) {
        // Buat slot dinamis jika belum ada
        const newSlotId = generateId("slot");
        await tx.insert(schema.dailySlots).values({
          id: newSlotId,
          tanggal: date,
          kapasitasMax: 5,
          kapasitasTerpakai: 0,
          status: "Open",
        });
        slot = {
          id: newSlotId,
          tanggal: date,
          kapasitasMax: 5,
          kapasitasTerpakai: 0,
          status: "Open",
        };
      }

      if (slot.status === "Closed") {
        throw new Error("Bengkel tutup pada tanggal yang dipilih");
      }

      if (slot.kapasitasTerpakai >= slot.kapasitasMax) {
        throw new Error("Kapasitas antrian untuk tanggal ini sudah penuh");
      }

      // 2. Insert/Cari Kendaraan
      let vehicle = await tx.query.kendaraan.findFirst({
        where: and(
          eq(schema.kendaraan.userId, userId),
          eq(schema.kendaraan.merek, brand),
          eq(schema.kendaraan.model, model || "")
        ),
      });

      if (!vehicle) {
        const newVehicleId = generateId("veh");
        await tx.insert(schema.kendaraan).values({
          id: newVehicleId,
          userId,
          jenis: "Motor",
          transmisi: transmission,
          merek: brand,
          model: model || "Kustom Model",
          tahun: new Date().getFullYear(),
          cc: Number(cc),
        });
        vehicle = {
          id: newVehicleId,
          userId,
          jenis: "Motor",
          transmisi: transmission,
          merek: brand,
          model: model || "Kustom Model",
          tahun: new Date().getFullYear(),
          cc: Number(cc),
        };
      }

      // 3. Simpan Pesanan Booking Utama
      const bookingId = generateId("bkg");
      await tx.insert(schema.bookings).values({
        id: bookingId,
        userId,
        kendaraanId: vehicle.id,
        tanggal: date,
        waktu: timeSlot,
        status: "Pending",
        catatan: notes || "",
        createdAt: Date.now(),
      });

      // 4. Simpan Layanan Service
      for (const serviceId of services) {
        await tx.insert(schema.bookingServices).values({
          id: generateId("bsrv"),
          bookingId,
          serviceId,
        });
      }

      // 5. Simpan Suku Cadang (Sparepart) jika ditambahkan
      if (cart && cart.length > 0) {
        for (const cartItem of cart) {
          const partId = cartItem.item.id;
          const qty = cartItem.qty;
          const price = cartItem.item.harga ?? cartItem.item.price;

          // Mengurangi stok sparepart di DB
          const currentPart = await tx.query.spareparts.findFirst({
            where: eq(schema.spareparts.id, partId),
          });

          if (currentPart && currentPart.stok >= qty) {
            await tx.update(schema.spareparts)
              .set({ stok: currentPart.stok - qty })
              .where(eq(schema.spareparts.id, partId));
          }

          await tx.insert(schema.bookingSpareparts).values({
            id: generateId("bpart"),
            bookingId,
            sparepartId: partId,
            qty,
            hargaSaatBooking: price,
          });
        }
      }

      // 6. Simpan Rekomendasi Oli jika dipilih
      if (selectedOil && selectedOil.id) {
        const oliId = selectedOil.id;
        const oilPrice = selectedOil.harga ?? selectedOil.price;

        await tx.insert(schema.bookingOli).values({
          id: generateId("boil"),
          bookingId,
          oliId,
          hargaSaatBooking: oilPrice,
        });
      }

      // 7. Perbarui kapasitas slot harian di DB (Increment slot terpakai)
      await tx.update(schema.dailySlots)
        .set({ kapasitasTerpakai: slot.kapasitasTerpakai + 1 })
        .where(eq(schema.dailySlots.id, slot.id));

      return {
        bookingId,
        status: "Pending",
        message: "Booking berhasil disimpan!",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error("Error in POST /api/bookings:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/bookings
// Mengubah status booking atau menambahkan catatan untuk pelanggan (oleh Admin)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status, catatan } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Parameter 'bookingId' diperlukan" }, { status: 400 });
    }

    const updateFields: { status?: string; catatan?: string } = {};
    if (status !== undefined) updateFields.status = status;
    if (catatan !== undefined) updateFields.catatan = catatan;

    await db.update(schema.bookings)
      .set(updateFields)
      .where(eq(schema.bookings.id, bookingId));

    const updated = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
    });

    return NextResponse.json({ message: "Booking berhasil diperbarui", booking: updated });
  } catch (error) {
    const err = error as Error;
    console.error("Error in PATCH /api/bookings:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

