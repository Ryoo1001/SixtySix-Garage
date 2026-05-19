import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Helper generator ID sederhana
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

// GET /api/spareparts?q=search_query&compat=Kawasaki+Ninja+250
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const compat = searchParams.get("compat");

    let allParts = await db.select().from(schema.spareparts);

    // Filter di memori jika ada kondisi pencarian
    if (q) {
      const queryLower = q.toLowerCase();
      allParts = allParts.filter(
        (part) =>
          part.nama.toLowerCase().includes(queryLower) ||
          part.kode.toLowerCase().includes(queryLower)
      );
    }

    // Filter kompatibilitas motor jika diminta
    if (compat) {
      const compatLower = compat.toLowerCase();
      allParts = allParts.filter((part) => {
        if (!part.kompatibilitas) return true; // Universal
        try {
          const arr: string[] = JSON.parse(part.kompatibilitas);
          return arr.some(
            (c) =>
              c.toLowerCase().includes(compatLower) ||
              c.toLowerCase() === "universal"
          );
        } catch {
          return true;
        }
      });
    }

    return NextResponse.json(allParts);
  } catch (error) {
    console.error("Error in GET /api/spareparts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/spareparts
// Menambahkan sparepart baru ke database (Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, kode, kategori, harga, stok, kompatibilitas, imageUrl } = body;

    if (!nama || !kode || !harga) {
      return NextResponse.json({ error: "Nama, Kode, dan Harga wajib diisi" }, { status: 400 });
    }

    const newPartId = generateId("sp");
    await db.insert(schema.spareparts).values({
      id: newPartId,
      nama,
      kode,
      kategori: kategori || "Umum",
      harga: Number(harga),
      stok: Number(stok || 0),
      kompatibilitas: kompatibilitas ? JSON.stringify(kompatibilitas) : JSON.stringify(["Universal"]),
      imageUrl: imageUrl || "",
    });

    const newPart = await db.query.spareparts.findFirst({
      where: eq(schema.spareparts.id, newPartId),
    });

    return NextResponse.json({ message: "Sparepart berhasil ditambahkan", sparepart: newPart });
  } catch (error) {
    const err = error as Error;
    console.error("Error in POST /api/spareparts:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/spareparts
// Memperbarui sparepart yang sudah ada (Admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nama, kode, kategori, harga, stok, kompatibilitas, imageUrl } = body;

    if (!id || !nama || !kode || !harga) {
      return NextResponse.json({ error: "ID, Nama, Kode, dan Harga wajib diisi" }, { status: 400 });
    }

    await db.update(schema.spareparts)
      .set({
        nama,
        kode,
        kategori: kategori || "Umum",
        harga: Number(harga),
        stok: Number(stok),
        kompatibilitas: kompatibilitas ? JSON.stringify(kompatibilitas) : JSON.stringify(["Universal"]),
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      })
      .where(eq(schema.spareparts.id, id));

    const updatedPart = await db.query.spareparts.findFirst({
      where: eq(schema.spareparts.id, id),
    });

    return NextResponse.json({ message: "Sparepart berhasil diperbarui", sparepart: updatedPart });
  } catch (error) {
    const err = error as Error;
    console.error("Error in PUT /api/spareparts:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/spareparts
// Menghapus sparepart dari database (Admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Parameter 'id' diperlukan" }, { status: 400 });
    }

    await db.delete(schema.spareparts).where(eq(schema.spareparts.id, id));

    return NextResponse.json({ message: "Sparepart berhasil dihapus" });
  } catch (error) {
    const err = error as Error;
    console.error("Error in DELETE /api/spareparts:", err.message);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
