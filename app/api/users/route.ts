import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/users
// Mengambil semua user/pelanggan beserta kendaraan dan riwayat service lengkapnya (Admin)
export async function GET() {
  try {
    // Ambil semua user terdaftar di DB
    const allUsers = await db.select().from(schema.user);

    // Ambil data kendaraan dan booking untuk masing-masing user secara komprehensif
    const detailedUsers = await Promise.all(
      allUsers.map(async (u) => {
        // Ambil info kendaraan milik user ini
        const vehicles = await db.query.kendaraan.findMany({
          where: eq(schema.kendaraan.userId, u.id),
        });

        // Ambil riwayat booking milik user ini
        const bookings = await db.query.bookings.findMany({
          where: eq(schema.bookings.userId, u.id),
          orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
        });

        // Hubungkan booking dengan detail kendaraan, jasa, oli, sparepart
        const detailedBookings = await Promise.all(
          bookings.map(async (booking) => {
            // Ambil info kendaraan spesifik untuk booking ini
            const v = vehicles.find((veh) => veh.id === booking.kendaraanId) || null;

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

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "Tidak ada nomor",
          createdAt: u.createdAt,
          vehicles,
          bookings: detailedBookings,
        };
      })
    );

    return NextResponse.json(detailedUsers);
  } catch (error) {
    const err = error as Error;
    console.error("Error in GET /api/users:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
