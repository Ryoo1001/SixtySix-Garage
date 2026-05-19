import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";

type OilSelect = typeof schema.oli.$inferSelect;

// Helper helper untuk perhitungan SAW dinamis
const WEIGHTS = {
  transmissionMatch: 0.30, // 30%
  ccMatch: 0.25,           // 25%
  budgetMatch: 0.20,       // 20%
  apiGrade: 0.15,          // 15%
  reputation: 0.10         // 10%
};

function getTransmissionScore(oil: OilSelect, transmission: string): number {
  return oil.tipeTransmisi.toLowerCase() === transmission.toLowerCase() ? 1 : 0;
}

function getCcScore(oil: OilSelect, cc: number): number {
  if (cc >= oil.ccMin && cc <= oil.ccMax) return 1;
  const padding = 50;
  if (cc >= oil.ccMin - padding && cc <= oil.ccMax + padding) return 0.5;
  return 0.1;
}

function getBudgetScore(oil: OilSelect, budget: string): number {
  const price = oil.harga;
  let targetMin = 0;
  let targetMax = 9999999;
  
  if (budget === "Low") {
    targetMin = 25000;
    targetMax = 49999;
  } else if (budget === "Medium") {
    targetMin = 50000;
    targetMax = 79999;
  } else if (budget === "High") {
    targetMin = 80000;
  }

  if (price >= targetMin && price <= targetMax) return 1;
  if (price < targetMin) return 0.8;
  if (price > targetMax && price <= targetMax + 20000) return 0.5;
  return 0.2;
}

function getApiGradeScore(oil: OilSelect): number {
  const grade = oil.gradeApi ? oil.gradeApi.toUpperCase() : "SL";
  // Convert API Grade to score
  if (grade === "SP") return 1.0;
  if (grade === "SN") return 0.9;
  if (grade === "SM") return 0.8;
  return 0.7; // SL or below
}

function getReputationScore(oil: OilSelect): number {
  return (oil.rating ?? 4.0) / 5;
}

// GET /api/oils
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transmission = searchParams.get("transmission");
    const cc = searchParams.get("cc") ? Number(searchParams.get("cc")) : null;
    const budget = searchParams.get("budget"); // Low, Medium, High

    // Ambil seluruh oli dari DB
    const allOils = await db.select().from(schema.oli);

    // Jika parameter rekomendasi SAW lengkap, lakukan kalkulasi
    if (transmission && cc !== null && budget) {
      const results = allOils.map((oil) => {
        const c1 = getTransmissionScore(oil, transmission);
        const c2 = getCcScore(oil, cc);
        const c3 = getBudgetScore(oil, budget);
        const c4 = getApiGradeScore(oil);
        const c5 = getReputationScore(oil);

        const score = 
          (c1 * WEIGHTS.transmissionMatch) +
          (c2 * WEIGHTS.ccMatch) +
          (c3 * WEIGHTS.budgetMatch) +
          (c4 * WEIGHTS.apiGrade) +
          (c5 * WEIGHTS.reputation);

        return {
          ...oil,
          sawScore: Number(score.toFixed(3)),
        };
      });

      // Filter ketat: Hanya oli dengan transmisi yang cocok
      const filtered = results.filter(
        (o) => o.tipeTransmisi.toLowerCase() === transmission.toLowerCase()
      );

      // Urutkan peringkat tertinggi
      filtered.sort((a, b) => b.sawScore - a.sawScore);

      // Kembalikan Top 3
      return NextResponse.json(filtered.slice(0, 3));
    }

    // Jika tidak ada parameter SAW, kembalikan semua oli
    return NextResponse.json(allOils);
  } catch (error) {
    console.error("Error in GET /api/oils:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
