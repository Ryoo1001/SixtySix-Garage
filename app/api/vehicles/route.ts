import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/vehicles
// Mengambil seluruh data kendaraan yang sudah pernah didaftarkan oleh pengguna aktif
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum masuk (Unauthorized)" }, { status: 401 });
    }

    const userId = session.user.id;
    const userVehicles = await db.query.kendaraan.findMany({
      where: eq(schema.kendaraan.userId, userId),
    });

    return NextResponse.json(userVehicles);
  } catch (error) {
    const err = error as Error;
    console.error("Error in GET /api/vehicles:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
