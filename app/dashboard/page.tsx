/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CustomerDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("riwayat");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat booking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/auth/login");
      } else {
        fetchBookings();
      }
    }
  }, [session, isPending, router]);

  // Hitung total estimasi biaya
  const getBookingTotal = (bk: any) => {
    const serviceTotal = bk.services?.reduce((sum: number, s: any) => sum + (s.hargaEstimasi || 0), 0) || 0;
    const sparepartsTotal = bk.spareparts?.reduce((sum: number, p: any) => sum + ((p.hargaSaatBooking || p.price || 0) * (p.qty || 0)), 0) || 0;
    const oilTotal = bk.oil ? (bk.oil.hargaSaatBooking || bk.oil.price || 0) : 0;
    return serviceTotal + sparepartsTotal + oilTotal;
  };

  // Kumpulkan kendaraan unik dari riwayat booking
  const uniqueVehicles = Array.from(
    new Map(
      bookings
        .filter((b) => b.kendaraan)
        .map((b) => [b.kendaraan.id, b.kendaraan])
    ).values()
  ) as any[];

  if (isPending || (session?.user && loading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <span>Memuat data dashboard SixtySixGarage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Selamat Datang Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Pelanggan</h1>
            <p className="text-zinc-400 mt-1 flex items-center gap-1.5 text-sm">
              Selamat datang kembali, <span className="text-primary font-semibold">{session?.user?.name}</span>
            </p>
          </div>
          <button 
            onClick={fetchBookings} 
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Riwayat
          </button>
        </div>

        {/* Custom Premium Tabs Navigation */}
        <div className="flex w-full max-w-md bg-black border border-zinc-800 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("riwayat")}
            className={cn(
              "flex-1 text-center font-bold rounded-lg py-2.5 text-sm transition-all duration-300",
              activeTab === "riwayat"
                ? "bg-primary text-primary-foreground shadow-lg font-extrabold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            )}
          >
            Riwayat Booking
          </button>
          <button
            onClick={() => setActiveTab("profil")}
            className={cn(
              "flex-1 text-center font-bold rounded-lg py-2.5 text-sm transition-all duration-300",
              activeTab === "profil"
                ? "bg-primary text-primary-foreground shadow-lg font-extrabold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            )}
          >
            Profil Kendaraan
          </button>
        </div>
        
        {/* TAB 1: RIWAYAT SERVICE */}
        {activeTab === "riwayat" && (
          <div className="animate-in fade-in duration-300">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="border-b border-zinc-800/50 pb-4">
                <CardTitle className="text-lg">Riwayat Service Anda</CardTitle>
                <CardDescription>Daftar pemesanan service motor Anda di Bengkel SixtySixGarage.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="bg-zinc-800/40 p-4 rounded-full border border-zinc-800 mb-4 text-zinc-500">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-white text-base">Belum Ada Riwayat Booking</h3>
                    <p className="text-sm text-zinc-500 max-w-sm mt-1">Anda belum melakukan pemesanan service online. Silakan buat booking pertama Anda.</p>
                    <a href="/booking" className="mt-5">
                      <button className="bg-primary hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
                        Buat Booking Baru <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </a>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                          <TableHead className="text-zinc-400 font-semibold">ID Booking</TableHead>
                          <TableHead className="text-zinc-400 font-semibold">Tanggal & Waktu</TableHead>
                          <TableHead className="text-zinc-400 font-semibold">Kendaraan</TableHead>
                          <TableHead className="text-zinc-400 font-semibold">Layanan & Part</TableHead>
                          <TableHead className="text-zinc-400 font-semibold">Status</TableHead>
                          <TableHead className="text-right text-zinc-400 font-semibold">Total Estimasi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((bk) => (
                          <TableRow key={bk.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <TableCell className="font-mono text-xs text-white font-semibold">
                              {bk.id.toUpperCase()}
                            </TableCell>
                            <TableCell className="text-sm text-zinc-300">
                              <div>{bk.tanggal}</div>
                              <div className="text-xs text-zinc-500 font-mono mt-0.5">{bk.jamSlot}</div>
                            </TableCell>
                            <TableCell className="text-sm text-zinc-300">
                              <div className="font-bold">{bk.kendaraan?.merek} {bk.kendaraan?.model}</div>
                              <div className="text-xs text-zinc-500">{bk.kendaraan?.transmisi} • {bk.kendaraan?.cc} CC</div>
                            </TableCell>
                            <TableCell className="text-sm text-zinc-300">
                              <div className="space-y-1">
                                {bk.services?.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    <span>{s.nama}</span>
                                  </div>
                                ))}
                                {bk.spareparts?.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-1 text-zinc-400 text-xs pl-2.5">
                                    <span>• Part: {p.nama} (x{p.qty})</span>
                                  </div>
                                ))}
                                {bk.oil && (
                                  <div className="flex items-center gap-1 text-zinc-400 text-xs pl-2.5">
                                    <span>• Oli: {bk.oil.nama} ({bk.oil.viskositas})</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={cn(
                                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                  bk.status === "Pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                  bk.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                  bk.status === "Completed" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                  "bg-red-500/10 text-red-500 border border-red-500/20"
                                )}
                              >
                                {
                                  bk.status === "Pending" ? "Menunggu" :
                                  bk.status === "Confirmed" ? "Dikonfirmasi" :
                                  bk.status === "Completed" ? "Selesai" : "Dibatalkan"
                                }
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-primary font-bold text-sm">
                              Rp {getBookingTotal(bk).toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* TAB 2: PROFIL KENDARAAN */}
        {activeTab === "profil" && (
          <div className="animate-in fade-in duration-300">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="border-b border-zinc-800/50 pb-4">
                <CardTitle className="text-lg">Profil Kendaraan Anda</CardTitle>
                <CardDescription>Daftar motor Anda yang pernah terdaftar dalam sistem service SixtySixGarage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {uniqueVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                    <AlertCircle className="h-8 w-8 text-zinc-650 mb-3" />
                    <p className="text-sm">Belum ada profil motor terdaftar.</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Data kendaraan akan terekam secara otomatis ketika Anda memesan service.</p>
                  </div>
                ) : (
                  uniqueVehicles.map((veh, index) => (
                    <div key={veh.id} className="bg-black p-5 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition-all">
                      <div>
                        <h4 className="font-extrabold text-white text-base">{veh.merek} {veh.model}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{veh.transmisi} • {veh.cc} CC • Tahun {veh.tahun || new Date().getFullYear()}</p>
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="border-primary text-primary font-bold text-[10px]">UTAMA</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
