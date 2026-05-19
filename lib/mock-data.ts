export type Sparepart = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  compatibility: string[]; // e.g. ["Kawasaki Ninja 250", "Universal"]
};

export type Oil = {
  id: string;
  name: string;
  brand: string;
  transmission: "Matic" | "Manual";
  viscosity: string;
  minCc: number;
  maxCc: number;
  price: number;
  apiGradeScore: number; // 1-100 (e.g. SP=100, SN=90, SM=80)
  rating: number; // 1-5
};

export const MOCK_SPAREPARTS: Sparepart[] = [
  { id: "sp-1", name: "Kampas Rem Depan Bendix", category: "Pengereman", price: 85000, stock: 20, compatibility: ["Kawasaki Ninja 250", "Universal"] },
  { id: "sp-2", name: "Filter Udara K&N", category: "Mesin", price: 350000, stock: 5, compatibility: ["Kawasaki Z250", "Kawasaki Ninja 250"] },
  { id: "sp-3", name: "Busi NGK Iridium", category: "Pengapian", price: 120000, stock: 15, compatibility: ["Universal"] },
  { id: "sp-4", name: "V-Belt KTC", category: "Transmisi", price: 180000, stock: 10, compatibility: ["Matic Universal"] },
  { id: "sp-5", name: "Gear Set SSS", category: "Transmisi", price: 300000, stock: 8, compatibility: ["Kawasaki KLX 150"] },
];

export const MOCK_OILS: Oil[] = [
  { id: "oil-1", name: "Kawasaki Genuine Oil 4T", brand: "Kawasaki", transmission: "Manual", viscosity: "10W-40", minCc: 150, maxCc: 1000, price: 95000, apiGradeScore: 90, rating: 4.8 },
  { id: "oil-2", name: "Motul 5100", brand: "Motul", transmission: "Manual", viscosity: "10W-40", minCc: 150, maxCc: 1000, price: 185000, apiGradeScore: 100, rating: 4.9 },
  { id: "oil-3", name: "Enduro Racing 4T", brand: "Pertamina", transmission: "Manual", viscosity: "10W-40", minCc: 100, maxCc: 250, price: 45000, apiGradeScore: 80, rating: 4.5 },
  { id: "oil-4", name: "Motul Scooter LE", brand: "Motul", transmission: "Matic", viscosity: "10W-30", minCc: 110, maxCc: 250, price: 85000, apiGradeScore: 90, rating: 4.7 },
  { id: "oil-5", name: "Federal Matic", brand: "Federal", transmission: "Matic", viscosity: "10W-40", minCc: 110, maxCc: 150, price: 42000, apiGradeScore: 80, rating: 4.6 },
  { id: "oil-6", name: "Shell Advance AX7", brand: "Shell", transmission: "Manual", viscosity: "10W-40", minCc: 150, maxCc: 400, price: 75000, apiGradeScore: 90, rating: 4.7 },
  { id: "oil-7", name: "Castrol Power1 Matic", brand: "Castrol", transmission: "Matic", viscosity: "10W-40", minCc: 110, maxCc: 150, price: 48000, apiGradeScore: 80, rating: 4.4 },
];

export const MOCK_SERVICES = [
  { id: "srv-1", name: "Service Ringan", price: 100000 },
  { id: "srv-2", name: "Service Besar", price: 350000 },
  { id: "srv-3", name: "Ganti Oli", price: 25000 },
  { id: "srv-4", name: "Tune Up", price: 150000 },
];
