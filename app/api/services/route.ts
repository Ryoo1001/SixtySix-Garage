import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { NextResponse } from "next/server";

// GET /api/services
// Mengambil semua jenis layanan service dari database
export async function GET() {
  try {
    const allServices = await db.select().from(schema.jenisService);
    return NextResponse.json(allServices);
  } catch (error) {
    const err = error as Error;
    console.error("Error in GET /api/services:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
