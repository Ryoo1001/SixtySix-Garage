import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    // Ubah file menjadi buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Beri nama unik agar tidak terjadi tabrakan file dengan nama sama
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${sanitizedFilename}`;

    // Tentukan direktori penyimpanan: public/uploads di dalam folder root frontend
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Pastikan direktori public/uploads sudah dibuat secara rekursif
    await mkdir(uploadDir, { recursive: true });

    // Tulis buffer ke file di server lokal
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // URL publik statis yang dapat langsung diakses oleh browser
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      success: true, 
      message: "File berhasil diunggah secara lokal!", 
      url: fileUrl 
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error in POST /api/upload:", err.message);
    return NextResponse.json({ 
      error: err.message || "Gagal memproses unggah file ke server lokal" 
    }, { status: 500 });
  }
}
