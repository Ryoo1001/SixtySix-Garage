import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/slots?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Parameter 'date' diperlukan (format: YYYY-MM-DD)" }, { status: 400 });
    }

    // Cari slot berdasarkan tanggal
    let slot = await db.query.dailySlots.findFirst({
      where: eq(schema.dailySlots.tanggal, date),
    });

    // Jika belum ada di DB, buat slot default (kapasitas 5) secara dinamis
    if (!slot) {
      const newSlotId = `slot-${Date.now()}`;
      await db.insert(schema.dailySlots).values({
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

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Error in GET /api/slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/slots
// Mengubah kapasitas slot harian atau status (buka/tutup) - Dapat diakses oleh Admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, kapasitasMax, status } = body;

    if (!date) {
      return NextResponse.json({ error: "Parameter 'date' diperlukan" }, { status: 400 });
    }

    // Cari slot
    const slot = await db.query.dailySlots.findFirst({
      where: eq(schema.dailySlots.tanggal, date),
    });

    if (!slot) {
      const newSlotId = `slot-${Date.now()}`;
      await db.insert(schema.dailySlots).values({
        id: newSlotId,
        tanggal: date,
        kapasitasMax: kapasitasMax ?? 5,
        kapasitasTerpakai: 0,
        status: status ?? "Open",
      });
    } else {
      await db.update(schema.dailySlots)
        .set({
          kapasitasMax: kapasitasMax ?? slot.kapasitasMax,
          status: status ?? slot.status,
        })
        .where(eq(schema.dailySlots.tanggal, date));
    }

    const updatedSlot = await db.query.dailySlots.findFirst({
      where: eq(schema.dailySlots.tanggal, date),
    });

    return NextResponse.json({ message: "Kapasitas slot berhasil diperbarui", slot: updatedSlot });
  } catch (error) {
    console.error("Error in POST /api/slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
