"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Search, Plus, Minus, Info, ShieldCheck, AlertCircle, RefreshCw, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparepart } from "@/lib/mock-data";
import { calculateSawRecommendation, SawInput, SawResult, BudgetCategory } from "@/lib/saw";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // DB Loaded States
  const [dbSpareparts, setDbSpareparts] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("new");
  const [loadingData, setLoadingData] = useState(true);

  // Form State - Step 1: Vehicle & Schedule
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleTransmission, setVehicleTransmission] = useState<"Matic" | "Manual">("Manual");
  const [vehicleCc, setVehicleCc] = useState<number | "">("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");

  // Form State - Step 2: Spareparts
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ item: Sparepart, qty: number }[]>([]);

  // Form State - Step 3: Oil Recommendation
  const [budget, setBudget] = useState<BudgetCategory>("Medium");
  const [oilRecommendations, setOilRecommendations] = useState<SawResult[]>([]);
  const [selectedOil, setSelectedOil] = useState<SawResult | null>(null);

  // Fetch Spareparts, Services & Registered Vehicles dynamically from DB
  const loadBookingOptions = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Services
      const resSrv = await fetch("/api/services");
      const dataSrv = await resSrv.json();
      if (Array.isArray(dataSrv)) {
        const mappedServices = dataSrv.map((s: any) => ({
          id: s.id,
          name: s.nama,
          price: s.hargaEstimasi,
          description: s.deskripsi || ""
        }));
        setDbServices(mappedServices);
      }

      // 2. Fetch Spareparts
      const resSp = await fetch("/api/spareparts");
      const dataSp = await resSp.json();
      if (Array.isArray(dataSp)) {
        const mappedSpareparts = dataSp.map((sp: any) => ({
          id: sp.id,
          name: sp.nama,
          price: sp.harga,
          stock: sp.stok,
          category: sp.kategori || "Umum",
          code: sp.kode || "",
          imageUrl: sp.imageUrl || ""
        }));
        setDbSpareparts(mappedSpareparts);
      }

      // 3. Fetch Registered Vehicles
      const resVeh = await fetch("/api/vehicles");
      if (resVeh.ok) {
        const dataVeh = await resVeh.json();
        if (Array.isArray(dataVeh)) {
          setUserVehicles(dataVeh);
          if (dataVeh.length > 0) {
            // Pilih kendaraan pertama secara default jika ada
            const firstVeh = dataVeh[0];
            setSelectedVehicleId(firstVeh.id);
            setVehicleBrand(firstVeh.merek);
            setVehicleModel(firstVeh.model);
            setVehicleTransmission(firstVeh.transmisi);
            setVehicleCc(firstVeh.cc);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching database booking options:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadBookingOptions();
  }, []);

  // Handle Registered Vehicle Dropdown Selection
  const handleVehicleSelect = (id: string) => {
    setSelectedVehicleId(id);
    if (id === "new") {
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleTransmission("Manual");
      setVehicleCc("");
    } else {
      const selected = userVehicles.find(v => v.id === id);
      if (selected) {
        setVehicleBrand(selected.merek);
        setVehicleModel(selected.model);
        setVehicleTransmission(selected.transmisi);
        setVehicleCc(selected.cc);
      }
    }
  };

  // Methods
  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleService = (srv: Service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === srv.id) ? prev.filter(s => s.id !== srv.id) : [...prev, srv]
    );
  };

  const addToCart = (sp: Sparepart) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === sp.id);
      if (existing) {
        return prev.map(i => i.item.id === sp.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item: sp, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const calculateOils = () => {
    if (!vehicleCc) return;
    const input: SawInput = {
      transmission: vehicleTransmission,
      cc: Number(vehicleCc),
      budget: budget
    };
    const results = calculateSawRecommendation(input);
    setOilRecommendations(results);
  };

  // Submit/Confirm Booking to REST API
  const handleConfirmBooking = async () => {
    if (!date) return;
    setLoading(true);
    setErrorMsg("");

    const formattedDate = format(date, "yyyy-MM-dd");

    const payload = {
      brand: vehicleBrand,
      model: vehicleModel || "Kustom Model",
      transmission: vehicleTransmission,
      cc: Number(vehicleCc),
      date: formattedDate,
      timeSlot: timeSlot,
      notes: "",
      services: selectedServices.map(s => s.id),
      cart: cart,
      selectedOil: selectedOil
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.error) {
        setErrorMsg(data.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan koneksi server. Pastikan Anda sudah login.");
    } finally {
      setLoading(false);
    }
  };

  // Derived calculations
  const totalServiceCost = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalSparepartCost = cart.reduce((acc, i) => acc + (i.item.price * i.qty), 0);
  const oilCost = selectedOil ? selectedOil.price : 0;
  const grandTotal = totalServiceCost + totalSparepartCost + oilCost;

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <span>Memuat opsi katalog service SixtySixGarage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Stepper Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Booking Service Online</h1>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors",
                step === i ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  step > i ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-500"
              )}>
                {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2 font-medium px-1">
            <span>Data & Jadwal</span>
            <span>Sparepart</span>
            <span>Oli (SAW)</span>
            <span>Konfirmasi</span>
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 md:p-8">

            {/* STEP 1: Data Kendaraan & Jadwal */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="bg-primary/20 p-2 rounded-lg text-primary"><CheckCircle2 className="w-5 h-5" /></span>
                    Data Kendaraan
                  </h2>

                  {/* Dropdown Pilihan Kendaraan Terdaftar */}
                  {userVehicles.length > 0 && (
                    <div className="mb-6 p-4 bg-black rounded-xl border border-primary/25 space-y-2">
                      <Label className="text-primary font-bold text-xs sm:text-sm tracking-wide">
                        Gunakan Motor Terdaftar Anda (Mencegah Duplikasi)
                      </Label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer font-medium"
                      >
                        {userVehicles.map((v) => (
                          <option key={v.id} value={v.id} className="bg-zinc-950 text-white font-medium">
                            {v.merek} {v.model} ({v.transmisi} • {v.cc} CC)
                          </option>
                        ))}
                        <option value="new" className="bg-zinc-950 text-primary font-bold">+ Tambah Motor Baru</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Merek Kendaraan</Label>
                      <select
                        value={vehicleBrand}
                        disabled={selectedVehicleId !== "new"}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 transition-colors [color-scheme:dark]"
                      >
                        <option value="" disabled className="text-zinc-500 bg-zinc-950">Pilih Merek</option>
                        <option value="Kawasaki" className="bg-zinc-950 text-white">Kawasaki</option>
                        <option value="Honda" className="bg-zinc-950 text-white">Honda</option>
                        <option value="Yamaha" className="bg-zinc-950 text-white">Yamaha</option>
                        <option value="Suzuki" className="bg-zinc-950 text-white">Suzuki</option>
                        <option value="Lainnya" className="bg-zinc-950 text-white">Lainnya</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model/Tipe</Label>
                      <Input 
                        value={vehicleModel} 
                        disabled={selectedVehicleId !== "new"}
                        onChange={e => setVehicleModel(e.target.value)} 
                        placeholder="Misal: Ninja 250 FI" 
                        className="bg-black border-zinc-800 disabled:opacity-60" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transmisi</Label>
                      <select
                        value={vehicleTransmission}
                        disabled={selectedVehicleId !== "new"}
                        onChange={(e) => setVehicleTransmission(e.target.value as "Matic" | "Manual")}
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                      >
                        <option value="Manual" className="bg-zinc-950 text-white">Manual</option>
                        <option value="Matic" className="bg-zinc-950 text-white">Matic</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kapasitas Mesin (CC)</Label>
                      <Input 
                        type="number" 
                        value={vehicleCc} 
                        disabled={selectedVehicleId !== "new"}
                        onChange={e => setVehicleCc(Number(e.target.value) || "")} 
                        placeholder="Misal: 250" 
                        className="bg-black border-zinc-800 disabled:opacity-60" 
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-800" />

                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="bg-primary/20 p-2 rounded-lg text-primary"><CalendarIcon className="w-5 h-5" /></span>
                    Jadwal & Jenis Service
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Tanggal Service</Label>
                      <input 
                        type="date"
                        value={date ? format(date, "yyyy-MM-dd") : ""}
                        onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                        min={format(new Date(), "yyyy-MM-dd")}
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors [color-scheme:dark]"
                      />

                      <Label className="mt-4 block">Waktu/Slot</Label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        <option value="" disabled className="text-zinc-500 bg-zinc-950">Pilih Jam</option>
                        <option value="09:00" className="bg-zinc-950 text-white">09:00 - 10:00</option>
                        <option value="10:00" className="bg-zinc-950 text-white">10:00 - 11:00</option>
                        <option value="13:00" className="bg-zinc-950 text-white">13:00 - 14:00</option>
                        <option value="15:00" className="bg-zinc-950 text-white">15:00 - 16:00</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <Label>Pilih Layanan Service</Label>
                      <div className="space-y-3 bg-black p-4 rounded-xl border border-zinc-800">
                        {dbServices.map(srv => (
                          <div key={srv.id} className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              id={srv.id} 
                              checked={!!selectedServices.find(s => s.id === srv.id)} 
                              onChange={() => toggleService(srv)}
                              className="w-4 h-4 rounded border-zinc-800 bg-black text-primary focus:ring-primary focus:ring-offset-zinc-950 focus:ring-2 accent-primary cursor-pointer"
                            />
                            <label htmlFor={srv.id} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                              {srv.name}
                            </label>
                            <span className="text-sm text-zinc-400">Rp {srv.price.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Spareparts */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    Tambah Sparepart <span className="text-sm font-normal text-zinc-500 ml-2">(Opsional)</span>
                  </h2>
                  <p className="text-sm text-zinc-400 mb-6">Pilih suku cadang yang ingin Anda ganti pada saat service.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Cari kampas rem, busi, dll..."
                    className="pl-10 bg-black border-zinc-800"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {dbSpareparts.filter(sp => sp.name.toLowerCase().includes(searchQuery.toLowerCase())).map(sp => (
                      <div key={sp.id} className="flex justify-between items-center p-4 bg-black border border-zinc-800 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 flex items-center justify-center">
                            {sp.imageUrl ? (
                              <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-cover" />
                            ) : (
                              <Wrench className="w-5 h-5 text-zinc-700" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-200 text-sm text-left">{sp.name}</h4>
                            <p className="text-xs text-zinc-500 text-left">{sp.category} • Stok: {sp.stock}</p>
                            <p className="text-sm text-primary font-medium mt-1 text-left">Rp {sp.price.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => addToCart(sp)} className="shrink-0">
                          Tambah
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
                    <h3 className="font-semibold text-lg border-b border-zinc-800 pb-3 mb-3">Keranjang Anda</h3>
                    {cart.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic">
                        Belum ada sparepart ditambahkan
                      </div>
                    ) : (
                      <div className="flex-1 space-y-3 overflow-y-auto">
                        {cart.map(c => (
                          <div key={c.item.id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="text-zinc-200">{c.item.name}</p>
                              <p className="text-primary">Rp {(c.item.price * c.qty).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-zinc-900 rounded-md p-1">
                              <button onClick={() => updateCartQty(c.item.id, -1)} className="p-1 hover:bg-zinc-800 rounded"><Minus className="w-3 h-3" /></button>
                              <span className="w-4 text-center">{c.qty}</span>
                              <button onClick={() => updateCartQty(c.item.id, 1)} className="p-1 hover:bg-zinc-800 rounded"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-primary">Rp {totalSparepartCost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Oil Recommendation (SAW) */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      Rekomendasi Oli Cerdas
                    </h2>
                    <p className="text-sm text-zinc-400">Sistem SAW akan mencari oli paling cocok untuk motor Anda.</p>
                  </div>
                  <div className="hidden sm:flex items-center bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> SAW Powered
                  </div>
                </div>

                <div className="bg-black p-5 rounded-xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Transmisi</Label>
                    <Input value={vehicleTransmission} readOnly className="bg-zinc-900 border-zinc-800 text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kapasitas Mesin (CC)</Label>
                    <Input value={vehicleCc} readOnly className="bg-zinc-900 border-zinc-800 text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Oli</Label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value as BudgetCategory)}
                      className="flex h-10 w-full rounded-md border border-primary bg-black px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-semibold"
                    >
                      <option value="Low" className="bg-zinc-950 text-white font-normal">Rendah (Rp 25k - 45k)</option>
                      <option value="Medium" className="bg-zinc-950 text-white font-normal">Sedang (Rp 50k - 70k)</option>
                      <option value="High" className="bg-zinc-950 text-white font-normal">Tinggi (Rp 80k+)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Button onClick={calculateOils} className="w-full sm:w-auto" disabled={!vehicleCc}>
                    <Search className="w-4 h-4 mr-2" /> Cari Rekomendasi
                  </Button>
                </div>

                {oilRecommendations.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="font-semibold text-lg border-b border-zinc-800 pb-2">Top 3 Rekomendasi Anda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {oilRecommendations.map((oil, index) => (
                        <div
                          key={oil.id}
                          onClick={() => setSelectedOil(oil)}
                          className={cn(
                            "relative p-4 rounded-xl border transition-all cursor-pointer",
                            selectedOil?.id === oil.id
                              ? "bg-primary/10 border-primary ring-1 ring-primary shadow-lg shadow-primary/10"
                              : "bg-black border-zinc-800 hover:border-zinc-600"
                          )}
                        >
                          {index === 0 && (
                            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                              #1 Pilihan Terbaik
                            </div>
                          )}
                          <div className="flex justify-between items-start mt-2">
                            <div>
                              <h4 className="font-bold text-white leading-tight">{oil.name}</h4>
                              <p className="text-xs text-zinc-500 mt-1">{oil.brand} • {oil.viscosity}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">
                                SAW: {oil.sawScore}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-end justify-between">
                            <p className="text-primary font-bold">Rp {oil.price.toLocaleString('id-ID')}</p>
                            {selectedOil?.id === oil.id && <CheckCircle2 className="text-primary w-5 h-5" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Konfirmasi */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Ringkasan Pesanan</h2>
                  <p className="text-sm text-zinc-400">Pastikan semua data sudah benar sebelum Anda mengkonfirmasi booking.</p>
                </div>

                <div className="bg-black border border-zinc-800 rounded-2xl p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-zinc-800">
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Jadwal</h4>
                      <p className="font-semibold text-white">{date ? format(date, "EEEE, d MMMM yyyy") : "-"}</p>
                      <p className="text-zinc-400">Pukul: {timeSlot || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Kendaraan</h4>
                      <p className="font-semibold text-white">{vehicleBrand} {vehicleModel}</p>
                      <p className="text-zinc-400">{vehicleTransmission} • {vehicleCc} CC</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rincian Estimasi Biaya</h4>

                    {/* Services */}
                    {selectedServices.map(srv => (
                      <div key={srv.id} className="flex justify-between text-sm">
                        <span className="text-zinc-300">Jasa: {srv.name}</span>
                        <span className="text-white">Rp {srv.price.toLocaleString('id-ID')}</span>
                      </div>
                    ))}

                    {/* Spareparts */}
                    {cart.map(c => (
                      <div key={c.item.id} className="flex justify-between text-sm">
                        <span className="text-zinc-300">Part: {c.item.name} <span className="text-zinc-500">x{c.qty}</span></span>
                        <span className="text-white">Rp {(c.item.price * c.qty).toLocaleString('id-ID')}</span>
                      </div>
                    ))}

                    {/* Oil */}
                    {selectedOil && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">Oli: {selectedOil.name}</span>
                        <span className="text-white">Rp {selectedOil.price.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-zinc-300">Total Estimasi</span>
                      <span className="text-2xl font-bold text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm text-primary/80">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>
                    <strong>Perhatian:</strong> Estimasi biaya yang ditampilkan bersifat perkiraan. Biaya final akan dihitung dan dibayarkan langsung di bengkel setelah pemeriksaan kendaraan oleh mekanik.
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}

          </CardContent>
          <CardFooter className="p-6 md:p-8 bg-zinc-950/50 flex justify-between border-t border-zinc-800 rounded-b-xl">
            <Button variant="outline" onClick={prevStep} disabled={step === 1} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
              <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>

            {step < 4 ? (
              <Button onClick={nextStep} disabled={step === 1 && (!vehicleBrand || !date || !timeSlot || selectedServices.length === 0)}>
                Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirmBooking}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 py-5"
              >
                {loading ? "Memproses..." : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Konfirmasi Booking
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
