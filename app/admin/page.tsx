"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Calendar, Users, Wrench, DollarSign, AlertCircle,
  Trash2, Plus, Check, X, Bell, Send, Search, FileText, RefreshCw
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, isPending } = authClient.useSession();

  // State data utama
  const [bookings, setBookings] = useState<any[]>([]);
  const [spareparts, setSpareparts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // State slot jadwal harian
  const [slotDate, setSlotDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [slotInfo, setSlotInfo] = useState<any>({ kapasitasMax: 5, kapasitasTerpakai: 0, status: "Open" });

  // State loading & filter
  const [loading, setLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [partSearchQuery, setPartSearchQuery] = useState("");

  // State Tab Aktif Kustom (Bebas Glitch Radix UI)
  const [activeTab, setActiveTab] = useState("bookings");

  // State input sparepart baru (CRUD)
  const [newPart, setNewPart] = useState({
    nama: "",
    kode: "",
    kategori: "Umum",
    harga: "",
    stok: "",
    kompatibilitas: "",
    imageUrl: "",
  });

  // State edit sparepart cepat (Quick Edit)
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editPartData, setEditPartData] = useState({ harga: 0, stok: 0, imageUrl: "" });

  // State untuk melacak upload file gambar lokal
  const [uploading, setUploading] = useState(false);

  // State catatan mekanik per booking
  const [notesInput, setNotesInput] = useState<{ [bookingId: string]: string }>({});

  // State untuk Log Notifikasi Simulasi ke Pelanggan
  const [notificationLogs, setNotificationLogs] = useState<string[]>([]);

  // Mengambil data utama dari API backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bookings (dengan param all=true agar mengambil semua pesanan di DB)
      const resBookings = await fetch("/api/bookings?all=true");
      const dataBookings = await resBookings.json();
      if (Array.isArray(dataBookings)) setBookings(dataBookings);

      // 2. Fetch Spareparts
      const resParts = await fetch("/api/spareparts");
      const dataParts = await resParts.json();
      if (Array.isArray(dataParts)) setSpareparts(dataParts);

      // 3. Fetch Customers (Daftar Pelanggan lengkap dengan riwayat booking & kendaraan)
      const resUsers = await fetch("/api/users");
      const dataUsers = await resUsers.json();
      if (Array.isArray(dataUsers)) setCustomers(dataUsers);
    } catch (error) {
      console.error("Gagal memuat data admin:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mengambil info slot harian
  const fetchSlotInfo = async (date: string) => {
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      if (data && !data.error) {
        setSlotInfo(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data slot:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSlotInfo(slotDate);
  }, []);

  useEffect(() => {
    fetchSlotInfo(slotDate);
  }, [slotDate]);

  // Menambahkan log notifikasi visual di layar
  const triggerNotificationLog = (message: string) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setNotificationLogs((prev) => [`[${time}] 🔔 ${message}`, ...prev.slice(0, 9)]);
  };

  // Mengubah status booking (PATCH)
  const handleUpdateStatus = async (bookingId: string, status: string, customerName: string, vehicleModel: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.booking) {
        // Refresh local bookings list
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: data.booking.status } : b))
        );
        // Refresh customer list if open
        if (selectedCustomer) {
          setSelectedCustomer((prev: any) => ({
            ...prev,
            bookings: prev.bookings.map((b: any) => (b.id === bookingId ? { ...b, status: data.booking.status } : b))
          }));
        }
        triggerNotificationLog(`Status pemesanan ${bookingId} (${vehicleModel}) diperbarui menjadi "${status}". Notifikasi terkirim ke WhatsApp ${customerName}!`);
        fetchData();
      }
    } catch (error) {
      console.error("Gagal memperbarui status:", error);
    }
  };

  // Menyimpan catatan mekanik untuk pelanggan (PATCH)
  const handleSaveNotes = async (bookingId: string, customerName: string) => {
    const noteText = notesInput[bookingId];
    if (!noteText || !noteText.trim()) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, catatan: noteText }),
      });
      const data = await res.json();
      if (data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, catatan: data.booking.catatan } : b))
        );
        if (selectedCustomer) {
          setSelectedCustomer((prev: any) => ({
            ...prev,
            bookings: prev.bookings.map((b: any) => (b.id === bookingId ? { ...b, catatan: data.booking.catatan } : b))
          }));
        }
        triggerNotificationLog(`Catatan ditambahkan untuk ${customerName}: "${noteText}". Log instruksi service berhasil tersinkronisasi ke dashboard pelanggan!`);
        setNotesInput((prev) => ({ ...prev, [bookingId]: "" }));
        fetchData();
      }
    } catch (error) {
      console.error("Gagal menyimpan catatan:", error);
    }
  };

  // Handler upload file gambar lokal ke server
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (isEdit) {
          setEditPartData((prev) => ({ ...prev, imageUrl: data.url }));
          triggerNotificationLog(`Foto produk "${file.name}" berhasil diunggah secara lokal ke server!`);
        } else {
          setNewPart((prev) => ({ ...prev, imageUrl: data.url }));
          triggerNotificationLog(`Foto produk "${file.name}" berhasil diunggah secara lokal ke server!`);
        }
      } else {
        alert(data.error || "Gagal mengunggah foto");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Terjadi kesalahan koneksi saat mengunggah.");
    } finally {
      setUploading(false);
    }
  };

  // CRUD: Menambahkan Suku Cadang Baru (POST)
  const handleCreateSparepart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.nama || !newPart.kode || !newPart.harga) return;

    try {
      const res = await fetch("/api/spareparts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPart,
          kompatibilitas: newPart.kompatibilitas ? newPart.kompatibilitas.split(",").map((s) => s.trim()) : null,
        }),
      });
      const data = await res.json();
      if (data.sparepart) {
        setSpareparts((prev) => [...prev, data.sparepart]);
        setNewPart({ nama: "", kode: "", kategori: "Umum", harga: "", stok: "", kompatibilitas: "", imageUrl: "" });
        triggerNotificationLog(`Suku Cadang "${data.sparepart.nama}" (${data.sparepart.kode}) berhasil ditambahkan ke katalog bengkel!`);
        fetchData();
      }
    } catch (error) {
      console.error("Gagal menambahkan sparepart:", error);
    }
  };

  // CRUD: Update Cepat Sparepart (PUT)
  const handleSaveQuickEditPart = async (id: string, nama: string, kode: string, kategori: string, kompatibilitasRaw: string) => {
    try {
      let compatArr = ["Universal"];
      try {
        compatArr = JSON.parse(kompatibilitasRaw);
      } catch {
        compatArr = kompatibilitasRaw.split(",").map(c => c.trim());
      }

      const res = await fetch("/api/spareparts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          nama,
          kode,
          kategori,
          harga: editPartData.harga,
          stok: editPartData.stok,
          kompatibilitas: compatArr
        }),
      });
      const data = await res.json();
      if (data.sparepart) {
        setSpareparts((prev) => prev.map((p) => (p.id === id ? data.sparepart : p)));
        setEditingPartId(null);
        triggerNotificationLog(`Stok & Harga suku cadang "${nama}" berhasil diperbarui di database SQLite!`);
        fetchData();
      }
    } catch (error) {
      console.error("Gagal mengedit sparepart:", error);
    }
  };

  // CRUD: Hapus Sparepart (DELETE)
  const handleDeleteSparepart = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus sparepart "${nama}" dari database?`)) return;
    try {
      const res = await fetch(`/api/spareparts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.error) {
        setSpareparts((prev) => prev.filter((p) => p.id !== id));
        triggerNotificationLog(`Suku Cadang "${nama}" telah dihapus secara permanen dari katalog!`);
        fetchData();
      }
    } catch (error) {
      console.error("Gagal menghapus sparepart:", error);
    }
  };

  // Manajemen Kapasitas Slot Harian (POST)
  const handleUpdateSlotCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: slotDate,
          kapasitasMax: slotInfo.kapasitasMax,
          status: slotInfo.status,
        }),
      });
      const data = await res.json();
      if (data.slot) {
        setSlotInfo(data.slot);
        triggerNotificationLog(`Kapasitas antrean tanggal ${slotDate} diperbarui menjadi ${slotInfo.kapasitasMax} slot (Status: ${slotInfo.status})!`);
      }
    } catch (error) {
      console.error("Gagal memperbarui slot harian:", error);
    }
  };

  // Filter Bookings berdasarkan filter status & search
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = bookingFilter === "Semua" || b.status === bookingFilter;
    const customerName = b.userId || "User";
    const vehicleName = b.kendaraan ? `${b.kendaraan.merek} ${b.kendaraan.model}` : "";
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tanggal.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // Filter Spareparts untuk pencarian
  const filteredSpareparts = spareparts.filter((p) => {
    return (
      p.nama.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
      p.kode.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(partSearchQuery.toLowerCase())
    );
  });

  // Perhitungan statistik dashboard admin
  const totalIncomingBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "Pending").length;
  const completedBookings = bookings.filter((b) => b.status === "Completed");
  const estimatedRevenue = completedBookings.reduce((sum, b) => {
    const jasaCost = b.services?.reduce((acc: number, s: any) => acc + (s.estimasiHarga || 0), 0) || 0;
    const partsCost = b.spareparts?.reduce((acc: number, p: any) => acc + (p.hargaSaatBooking * p.qty), 0) || 0;
    const oilCost = b.oil ? (b.oil.hargaSaatBooking || 0) : 0;
    return sum + jasaCost + partsCost + oilCost;
  }, 0);
  const lowStockAlerts = spareparts.filter((p) => p.stok < 5).length;

  // Jika sedang memuat sesi, tampilkan loader premium
  if (isPending) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <span>Memeriksa hak akses admin bengkel SixtySixGarage...</span>
        </div>
      </div>
    );
  }

  // Jika tidak login atau bukan admin, tampilkan akses ditolak
  const isAdmin = (session?.user as any)?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-red-500/10 p-5 rounded-full border border-red-500/20 mb-6">
          <AlertCircle className="h-12 w-12 text-primary animate-bounce" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Akses Ditolak!</h1>
        <p className="mt-3 text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">
          Maaf, halaman ini dilindungi oleh modul keamanan bengkel SixtySixGarage. Akun Anda tidak memiliki hak akses administrator.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="/">
            <Button className="bg-primary hover:bg-red-700 text-white rounded-lg py-5 px-6 font-semibold">
              Kembali ke Beranda
            </Button>
          </a>
          <a href="/auth/login">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-lg py-5 px-6 font-semibold">
              Masuk Akun Admin
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              SixtySix<span className="text-primary">Garage</span> Admin
              <Badge variant="outline" className="border-primary text-primary ml-2">Panel Dashboard</Badge>
            </h1>
            <p className="text-zinc-400 mt-1">Kelola pesanan booking, katalog sparepart, kapasitas harian, dan verifikasi komplain pelanggan.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-900 text-zinc-300 flex items-center gap-2 hover:bg-zinc-800" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> Segarkan Data
            </Button>
          </div>
        </div>

        {/* Floating live simulated notification log widget */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-zinc-800"><Wrench className="h-12 w-12" /></div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-zinc-400 font-medium">Total Antrean Masuk</CardDescription>
                  <CardTitle className="text-3xl font-bold text-white mt-1">{totalIncomingBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500">{pendingCount} Pesanan pending perlu ditinjau</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-zinc-800"><Calendar className="h-12 w-12" /></div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-zinc-400 font-medium">Kapasitas Hari Ini</CardDescription>
                  <CardTitle className="text-3xl font-bold text-primary mt-1">{slotInfo.kapasitasTerpakai} / {slotInfo.kapasitasMax}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500">Status slot harian: <span className="font-semibold text-emerald-500">{slotInfo.status}</span></p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-zinc-800"><AlertCircle className="h-12 w-12" /></div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-zinc-400 font-medium">Alert Stok Menipis</CardDescription>
                  <CardTitle className="text-3xl font-bold text-yellow-500 mt-1">{lowStockAlerts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500">Suku cadang dengan stok di bawah 5</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-zinc-800"><DollarSign className="h-12 w-12" /></div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-zinc-400 font-medium">Estimasi Pendapatan</CardDescription>
                  <CardTitle className="text-2xl font-bold text-emerald-400 mt-1.5">Rp {estimatedRevenue.toLocaleString("id-ID")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500">Dari booking berstatus &ldquo;Selesai&rdquo;</p>
                </CardContent>
              </Card>
            </div>

            {/* Custom Stateful Tab Switched Navigation */}
            <div className="w-full space-y-6">

              {/* Tab Selector Buttons */}
              <div className="grid w-full grid-cols-2 md:grid-cols-4 bg-black border border-zinc-800 rounded-xl overflow-hidden p-1 gap-1">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`transition-all text-xs sm:text-sm font-semibold rounded-lg py-3 text-center ${activeTab === "bookings"
                      ? "bg-primary text-white shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                >
                  Antrean Booking
                </button>
                <button
                  onClick={() => setActiveTab("spareparts")}
                  className={`transition-all text-xs sm:text-sm font-semibold rounded-lg py-3 text-center ${activeTab === "spareparts"
                      ? "bg-primary text-white shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                >
                  Suku Cadang (CRUD)
                </button>
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`transition-all text-xs sm:text-sm font-semibold rounded-lg py-3 text-center ${activeTab === "customers"
                      ? "bg-primary text-white shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                >
                  Pelanggan
                </button>
                <button
                  onClick={() => setActiveTab("slots")}
                  className={`transition-all text-xs sm:text-sm font-semibold rounded-lg py-3 text-center ${activeTab === "slots"
                      ? "bg-primary text-white shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                >
                  Slot Kapasitas
                </button>
              </div>

              {/* Tab 1: Manajemen Booking */}
              {activeTab === "bookings" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 gap-4">
                      <div>
                        <CardTitle className="text-xl text-white">Kelola Pemesanan Service</CardTitle>
                        <CardDescription className="text-zinc-400">Daftar booking aktif masuk ke dalam antrean bengkel.</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {["Semua", "Pending", "Confirmed", "Completed", "Cancelled"].map((tabFilter) => (
                          <Button
                            key={tabFilter}
                            variant="ghost"
                            size="sm"
                            className={`text-xs px-3 py-1.5 rounded-lg border border-zinc-800 font-medium ${bookingFilter === tabFilter ? "bg-primary text-white" : "bg-black text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              }`}
                            onClick={() => setBookingFilter(tabFilter)}
                          >
                            {tabFilter}
                          </Button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">

                      {/* Search box */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          placeholder="Cari berdasarkan ID booking, tanggal (YYYY-MM-DD), atau motor..."
                          className="pl-10 bg-black border-zinc-800 text-white placeholder-zinc-500 rounded-xl"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-zinc-800">
                        <Table>
                          <TableHeader className="bg-black/60">
                            <TableRow className="border-zinc-800">
                              <TableHead className="text-zinc-400">ID Booking & Tgl</TableHead>
                              <TableHead className="text-zinc-400">Kendaraan & CC</TableHead>
                              <TableHead className="text-zinc-400">Jasa & Suku Cadang</TableHead>
                              <TableHead className="text-zinc-400">Catatan Mekanik</TableHead>
                              <TableHead className="text-zinc-400">Status</TableHead>
                              <TableHead className="text-center text-zinc-400">Tindakan Admin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow className="border-zinc-800">
                                <TableCell colSpan={6} className="text-center text-zinc-400 py-8">Memuat pesanan booking...</TableCell>
                              </TableRow>
                            ) : filteredBookings.length === 0 ? (
                              <TableRow className="border-zinc-800">
                                <TableCell colSpan={6} className="text-center text-zinc-400 py-8">Tidak ada antrean booking ditemukan.</TableCell>
                              </TableRow>
                            ) : (
                              filteredBookings.map((b) => {
                                // Tentukan label customer (bisa dari phone / user jika tidak ada data ter-join)
                                const customerName = b.userId ? `ID: ${b.userId.substring(0, 8)}...` : "Pelanggan";
                                const vehicleModel = b.kendaraan ? `${b.kendaraan.merek} ${b.kendaraan.model}` : "Motor";

                                return (
                                  <TableRow key={b.id} className="border-zinc-800 hover:bg-zinc-800/40 transition-colors align-top">
                                    <TableCell className="font-semibold text-white py-4">
                                      <div className="text-primary font-mono text-sm">{b.id}</div>
                                      <div className="text-xs text-zinc-400 mt-1">{b.tanggal} ({b.waktu})</div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="font-bold text-white text-sm">{vehicleModel}</div>
                                      <div className="text-xs text-zinc-400 mt-1">{b.kendaraan?.transmisi} • {b.kendaraan?.cc} CC</div>
                                    </TableCell>
                                    <TableCell className="py-4 max-w-[200px]">
                                      {/* Jasa Service */}
                                      <div className="text-xs font-semibold text-zinc-300">Jasa:</div>
                                      <ul className="list-disc list-inside text-[11px] text-zinc-400 pl-1 mb-2">
                                        {b.services?.map((s: any, idx: number) => (
                                          <li key={idx} className="truncate">{s.nama}</li>
                                        ))}
                                      </ul>
                                      {/* Sparepart & Oli */}
                                      {(b.spareparts?.length > 0 || b.oil) && (
                                        <div className="text-[11px] font-semibold text-zinc-300 mt-1">Produk:</div>
                                      )}
                                      <div className="flex flex-col gap-0.5 pl-1 text-[11px] text-zinc-400">
                                        {b.spareparts?.map((p: any, idx: number) => (
                                          <span key={idx} className="truncate">• {p.nama} (x{p.qty})</span>
                                        ))}
                                        {b.oil && (
                                          <span className="truncate text-red-400">• {b.oil.nama}</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4 min-w-[200px]">
                                      <div className="space-y-2">
                                        {b.catatan ? (
                                          <div className="bg-black/40 p-2 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-300 italic relative">
                                            &ldquo;{b.catatan}&rdquo;
                                          </div>
                                        ) : (
                                          <span className="text-[11px] text-zinc-500 italic">Belum ada catatan mekanik</span>
                                        )}
                                        <div className="flex gap-1">
                                          <Input
                                            placeholder="Ketik catatan mekanik..."
                                            className="h-7 text-xs bg-black border-zinc-800 text-white placeholder-zinc-600 rounded-lg"
                                            value={notesInput[b.id] || ""}
                                            onChange={(e) => setNotesInput((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                          />
                                          <Button
                                            size="sm"
                                            className="h-7 text-xs bg-primary hover:bg-red-700 text-white px-2 rounded-lg flex items-center gap-1"
                                            onClick={() => handleSaveNotes(b.id, customerName)}
                                          >
                                            <Send className="h-3 w-3" /> Simpan
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold uppercase ${b.status === "Pending" ? "border-yellow-600 bg-yellow-600/10 text-yellow-500" :
                                            b.status === "Confirmed" ? "border-blue-600 bg-blue-600/10 text-blue-400" :
                                              b.status === "Completed" ? "border-emerald-600 bg-emerald-600/10 text-emerald-400" :
                                                "border-zinc-700 bg-zinc-800/30 text-zinc-400"
                                          }`}
                                      >
                                        {b.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="flex flex-col gap-1 items-center justify-center">
                                        {b.status === "Pending" && (
                                          <Button
                                            size="sm"
                                            className="w-24 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1"
                                            onClick={() => handleUpdateStatus(b.id, "Confirmed", customerName, vehicleModel)}
                                          >
                                            Konfirmasi
                                          </Button>
                                        )}
                                        {b.status === "Confirmed" && (
                                          <Button
                                            size="sm"
                                            className="w-24 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1"
                                            onClick={() => handleUpdateStatus(b.id, "Completed", customerName, vehicleModel)}
                                          >
                                            Selesai
                                          </Button>
                                        )}
                                        {b.status !== "Completed" && b.status !== "Cancelled" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-24 h-7 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-850 hover:text-white rounded-lg flex items-center justify-center"
                                            onClick={() => handleUpdateStatus(b.id, "Cancelled", customerName, vehicleModel)}
                                          >
                                            Batalkan
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tab 2: CRUD Suku Cadang */}
              {activeTab === "spareparts" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">

                  {/* Sparepart List Table */}
                  <div className="xl:col-span-2 space-y-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Katalog Suku Cadang</CardTitle>
                        <CardDescription className="text-zinc-400">Kelola ketersediaan suku cadang dan oli motor di bengkel.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">

                        {/* Search sparepart */}
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            placeholder="Cari berdasarkan nama, kode, atau kategori sparepart..."
                            className="pl-10 bg-black border-zinc-800 text-white placeholder-zinc-500 rounded-xl"
                            value={partSearchQuery}
                            onChange={(e) => setPartSearchQuery(e.target.value)}
                          />
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-zinc-800">
                          <Table>
                            <TableHeader className="bg-black/60">
                              <TableRow className="border-zinc-800">
                                <TableHead className="text-zinc-400">Kode & Nama</TableHead>
                                <TableHead className="text-zinc-400">Kategori</TableHead>
                                <TableHead className="text-zinc-400">Stok</TableHead>
                                <TableHead className="text-zinc-400">Harga</TableHead>
                                <TableHead className="text-center text-zinc-400">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSpareparts.map((p) => {
                                const isEditing = editingPartId === p.id;

                                return (
                                  <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                                    <TableCell className="font-semibold text-white py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 flex items-center justify-center">
                                          {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.nama} className="w-full h-full object-cover" />
                                          ) : (
                                            <Wrench className="w-4 h-4 text-zinc-600" />
                                          )}
                                        </div>
                                        <div className="flex-1 space-y-1 text-left">
                                          <div className="text-zinc-300 text-sm">{p.nama}</div>
                                          <div className="text-[11px] text-zinc-500 font-mono">{p.kode}</div>
                                          {isEditing && (
                                            <div className="pt-2 w-full max-w-[220px] space-y-2 border-t border-zinc-800/60 mt-1">
                                              <div className="flex gap-1.5 text-[8px] font-bold">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditPartData((prev) => ({ ...prev, _method: "link" } as any))}
                                                  className={cn(
                                                    "px-1.5 py-0.5 rounded transition-all",
                                                    (!(editPartData as any)._method || (editPartData as any)._method === "link")
                                                      ? "bg-zinc-800 text-white"
                                                      : "text-zinc-500 hover:text-zinc-300"
                                                  )}
                                                >
                                                  URL Link
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditPartData((prev) => ({ ...prev, _method: "file" } as any))}
                                                  className={cn(
                                                    "px-1.5 py-0.5 rounded transition-all",
                                                    ((editPartData as any)._method === "file")
                                                      ? "bg-zinc-800 text-white"
                                                      : "text-zinc-500 hover:text-zinc-300"
                                                  )}
                                                >
                                                  Upload File
                                                </button>
                                              </div>

                                              {(!(editPartData as any)._method || (editPartData as any)._method === "link") ? (
                                                <Input
                                                  type="text"
                                                  placeholder="https://..."
                                                  className="w-full h-6 text-[9px] bg-black border-zinc-700 text-white px-1.5 py-0.5"
                                                  value={editPartData.imageUrl}
                                                  onChange={(e) => setEditPartData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                                />
                                              ) : (
                                                <div className="relative flex items-center justify-center border border-dashed border-zinc-750 hover:border-zinc-700 bg-black/40 rounded-lg p-2 cursor-pointer">
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, true)}
                                                    disabled={uploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                  />
                                                  <span className="text-[9px] font-semibold text-zinc-400 block">
                                                    {uploading ? "Mengunggah..." : "Pilih File Baru"}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <Badge className="bg-zinc-800 text-zinc-300 text-[10px] uppercase font-semibold">{p.kategori}</Badge>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          className="w-16 h-7 text-xs bg-black border-zinc-700 text-white"
                                          value={editPartData.stok}
                                          onChange={(e) => setEditPartData((prev) => ({ ...prev, stok: Number(e.target.value) }))}
                                        />
                                      ) : (
                                        <span className={`text-sm font-semibold ${p.stok < 5 ? "text-red-500 font-bold" : "text-zinc-300"}`}>
                                          {p.stok} Unit {p.stok < 5 && "(Menipis!)"}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          className="w-24 h-7 text-xs bg-black border-zinc-700 text-white"
                                          value={editPartData.harga}
                                          onChange={(e) => setEditPartData((prev) => ({ ...prev, harga: Number(e.target.value) }))}
                                        />
                                      ) : (
                                        <span className="text-sm text-primary font-bold">Rp {p.harga.toLocaleString("id-ID")}</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="flex gap-2 justify-center">
                                        {isEditing ? (
                                          <>
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 rounded-lg flex items-center gap-1"
                                              onClick={() => handleSaveQuickEditPart(p.id, p.nama, p.kode, p.kategori, p.kompatibilitas)}
                                            >
                                              <Check className="h-3 w-3" /> Simpan
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs border-zinc-750 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 rounded-lg"
                                              onClick={() => setEditingPartId(null)}
                                            >
                                              <X className="h-3 w-3" /> Batal
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 rounded-lg"
                                              onClick={() => {
                                                setEditingPartId(p.id);
                                                setEditPartData({ harga: p.harga, stok: p.stok, imageUrl: p.imageUrl || "" });
                                              }}
                                            >
                                              Sunting
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 text-xs hover:bg-red-950/20 text-zinc-500 hover:text-primary rounded-lg"
                                              onClick={() => handleDeleteSparepart(p.id, p.nama)}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Add New Sparepart Form Card */}
                  <div>
                    <Card className="bg-zinc-900 border-zinc-800 sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Tambah Suku Cadang Baru</CardTitle>
                        <CardDescription className="text-zinc-400">Masukkan item produk/oli baru ke sistem inventori.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateSparepart} className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Nama Suku Cadang *</label>
                            <Input
                              placeholder="e.g. Filter Oli Kawasaki Genuine"
                              className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650"
                              value={newPart.nama}
                              onChange={(e) => setNewPart((prev) => ({ ...prev, nama: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-zinc-300">Kode Item *</label>
                              <Input
                                placeholder="e.g. KAW-5028"
                                className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650"
                                value={newPart.kode}
                                onChange={(e) => setNewPart((prev) => ({ ...prev, kode: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-zinc-300">Kategori</label>
                              <select
                                className="mt-1 w-full h-10 bg-black border border-zinc-800 text-white px-3 rounded-lg text-sm"
                                value={newPart.kategori}
                                onChange={(e) => setNewPart((prev) => ({ ...prev, kategori: e.target.value }))}
                              >
                                <option value="Umum">Umum (Brake/Pad)</option>
                                <option value="Mesin">Mesin</option>
                                <option value="Oli">Oli / SAW</option>
                                <option value="Aksesoris">Aksesoris</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-zinc-300">Harga Jual (Rp) *</label>
                              <Input
                                type="number"
                                placeholder="Harga dalam Rupiah"
                                className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650"
                                value={newPart.harga}
                                onChange={(e) => setNewPart((prev) => ({ ...prev, harga: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-zinc-300">Stok Awal (Unit) *</label>
                              <Input
                                type="number"
                                placeholder="Stok awal gudang"
                                className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650"
                                value={newPart.stok}
                                onChange={(e) => setNewPart((prev) => ({ ...prev, stok: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Kompatibilitas Motor (Pisahkan dengan koma)</label>
                            <Input
                              placeholder="e.g. Ninja 250, Ninja ZX25R, Universal"
                              className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650"
                              value={newPart.kompatibilitas}
                              onChange={(e) => setNewPart((prev) => ({ ...prev, kompatibilitas: e.target.value }))}
                            />
                            <span className="text-[10px] text-zinc-500 mt-1 block">Tulis &apos;Universal&apos; jika sparepart/oli cocok untuk semua jenis motor.</span>
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-zinc-300">Foto/Gambar Produk</label>
                            <div className="grid grid-cols-2 gap-2 bg-black/45 border border-zinc-800/80 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setNewPart((prev) => ({ ...prev, _uploadMethod: "link" } as any))}
                                className={cn(
                                  "py-1.5 text-[11px] font-bold rounded-md transition-all text-center",
                                  (!(newPart as any)._uploadMethod || (newPart as any)._uploadMethod === "link")
                                    ? "bg-zinc-850 text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                Link Gambar (URL)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewPart((prev) => ({ ...prev, _uploadMethod: "file" } as any))}
                                className={cn(
                                  "py-1.5 text-[11px] font-bold rounded-md transition-all text-center",
                                  ((newPart as any)._uploadMethod === "file")
                                    ? "bg-zinc-850 text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                Upload Foto Lokal
                              </button>
                            </div>

                            {(!(newPart as any)._uploadMethod || (newPart as any)._uploadMethod === "link") ? (
                              <Input
                                placeholder="e.g. https://images.unsplash.com/..."
                                className="mt-1 bg-black border-zinc-800 text-white placeholder-zinc-650 text-xs"
                                value={newPart.imageUrl}
                                onChange={(e) => setNewPart((prev) => ({ ...prev, imageUrl: e.target.value }))}
                              />
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="relative flex items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-black/20 rounded-xl p-4 transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, false)}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <div className="text-center space-y-1.5">
                                    <span className="text-xs font-semibold text-zinc-400 block">
                                      {uploading ? "Mengunggah..." : "Pilih File Foto Anda"}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 block">PNG, JPG, JPEG maks 5MB</span>
                                  </div>
                                </div>
                                {newPart.imageUrl && (
                                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-850 p-2 rounded-lg">
                                    <div className="w-10 h-10 rounded overflow-hidden border border-zinc-800 bg-black shrink-0">
                                      <img src={newPart.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-mono truncate flex-1 text-left">{newPart.imageUrl}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            <span className="text-[10px] text-zinc-500 block">Foto ini akan ditampilkan di katalog pilihan pelanggan.</span>
                          </div>
                          <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white flex items-center justify-center gap-2 rounded-xl mt-6 py-5">
                            <Plus className="h-4 w-4" /> Tambah Suku Cadang
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 3: Daftar Pelanggan & Komplain */}
              {activeTab === "customers" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">

                  {/* Left Column: Customer Selection Table */}
                  <div className="md:col-span-1">
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Daftar Pelanggan</CardTitle>
                        <CardDescription className="text-zinc-400">Pilih pelanggan untuk meninjau detail dan riwayat keluhan/complain.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                        {customers.map((c) => {
                          const isSelected = selectedCustomer?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${isSelected
                                  ? "bg-primary/10 border-primary text-white"
                                  : "bg-black border-zinc-850 hover:border-zinc-700 text-zinc-300"
                                }`}
                              onClick={() => setSelectedCustomer(c)}
                            >
                              <div className="font-bold flex justify-between items-center text-sm">
                                <span>{c.name || "Customer Tanpa Nama"}</span>
                                <Badge className="text-[9px] bg-zinc-800 text-zinc-300 font-semibold">{c.bookings.length} Booking</Badge>
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">{c.email}</div>
                              <div className="text-[11px] text-zinc-500 mt-1 font-mono">{c.phone}</div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Customer History Detail */}
                  <div className="md:col-span-2">
                    {selectedCustomer ? (
                      <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="border-b border-zinc-800 pb-4">
                          <CardTitle className="text-white text-xl flex justify-between items-center">
                            <span>Detail Riwayat: {selectedCustomer.name}</span>
                            <span className="text-zinc-500 text-xs font-mono">ID: {selectedCustomer.id.substring(0, 12)}...</span>
                          </CardTitle>
                          <CardDescription className="text-zinc-400 flex flex-col sm:flex-row gap-4 mt-1.5">
                            <span>Email: <strong className="text-zinc-200">{selectedCustomer.email}</strong></span>
                            <span>Telepon: <strong className="text-zinc-200">{selectedCustomer.phone}</strong></span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                          {/* Vehicles List */}
                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                              <Wrench className="h-4 w-4 text-primary" /> Daftar Motor Terdaftar:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedCustomer.vehicles.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">Belum mendaftarkan kendaraan.</p>
                              ) : (
                                selectedCustomer.vehicles.map((v: any, idx: number) => (
                                  <div key={idx} className="bg-black p-3 rounded-lg border border-zinc-800 text-xs">
                                    <div className="font-bold text-white">{v.merek} {v.model}</div>
                                    <div className="text-[10px] text-zinc-400 mt-1">{v.transmisi} • {v.cc} CC • Tahun {v.tahun}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Chronological Booking History Timeline */}
                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                              <FileText className="h-4 w-4 text-primary" /> Riwayat Booking & Komplain (Kronologis):
                            </h4>
                            <div className="space-y-4">
                              {selectedCustomer.bookings.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">Belum memiliki riwayat booking.</p>
                              ) : (
                                selectedCustomer.bookings.map((b: any, idx: number) => (
                                  <div key={idx} className="bg-black p-4 rounded-xl border border-zinc-800 space-y-3">
                                    <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                                      <div>
                                        <span className="text-primary font-mono font-bold text-xs">{b.id}</span>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">{b.tanggal} ({b.waktu})</div>
                                      </div>
                                      <Badge
                                        className={`text-[9px] ${b.status === "Pending" ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/50" :
                                            b.status === "Confirmed" ? "bg-blue-600/20 text-blue-400 border border-blue-600/50" :
                                              b.status === "Completed" ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/50" :
                                                "bg-zinc-800 text-zinc-400"
                                          }`}
                                      >
                                        {b.status}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="text-zinc-500 block">Motor Serviced:</span>
                                        <strong className="text-zinc-300">{b.kendaraan ? `${b.kendaraan.merek} ${b.kendaraan.model}` : "Motor"}</strong>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block">Jasa Service:</span>
                                        <strong className="text-zinc-300">{b.services.map((s: any) => s.nama).join(", ") || "-"}</strong>
                                      </div>
                                    </div>

                                    {/* Products list */}
                                    {(b.spareparts.length > 0 || b.oil) && (
                                      <div className="text-xs border-t border-zinc-800/80 pt-2 grid grid-cols-2 gap-4">
                                        <div>
                                          <span className="text-zinc-500 block">Spareparts Dipasang:</span>
                                          <div className="text-[11px] text-zinc-300">
                                            {b.spareparts.map((p: any) => `${p.nama} (x${p.qty})`).join(", ") || "-"}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block">Rekomendasi Oli (SAW):</span>
                                          <strong className="text-[11px] text-red-400">{b.oil ? b.oil.nama : "-"}</strong>
                                        </div>
                                      </div>
                                    )}

                                    {/* Mechanic notes display */}
                                    <div className="border-t border-zinc-850 pt-2.5">
                                      <span className="text-xs text-zinc-500 block font-semibold mb-1">Catatan Mekanik / Keluhan Terpecahkan:</span>
                                      {b.catatan ? (
                                        <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 italic">
                                          &ldquo;{b.catatan}&rdquo;
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-zinc-600 italic">Belum ada catatan penyelesaian/keluhan.</span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="h-full bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-center items-center p-12 text-center text-zinc-500 gap-4">
                        <Users className="h-16 w-16 text-zinc-650" />
                        <div>
                          <h4 className="font-bold text-white text-lg">Pemeriksaan Riwayat & Komplain</h4>
                          <p className="text-sm text-zinc-450 mt-1 max-w-sm">Pilih pelanggan di menu sebelah kiri untuk melihat histori motor, riwayat komplain, catatan mekanik, dan rincian transaksi.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Slot Kapasitas */}
              {activeTab === "slots" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">

                  {/* Slot Configuration Form */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Konfigurasi Kuota Antrean Harian</CardTitle>
                      <CardDescription className="text-zinc-400">Atur kapasitas antrean bengkel atau tutup operasional pada tanggal tertentu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateSlotCapacity} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300">Pilih Tanggal Booking *</label>
                          <Input
                            type="date"
                            className="mt-1 bg-black border-zinc-800 text-white [color-scheme:dark] rounded-lg"
                            value={slotDate}
                            onChange={(e) => setSlotDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Kapasitas Maksimal (Slot)</label>
                            <Input
                              type="number"
                              className="mt-1 bg-black border-zinc-800 text-white"
                              value={slotInfo.kapasitasMax}
                              onChange={(e) => setSlotInfo((prev: any) => ({ ...prev, kapasitasMax: Number(e.target.value) }))}
                              required
                            />
                            <span className="text-[10px] text-zinc-500 mt-1 block">Default kapasitas adalah 5 antrean per hari.</span>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Status Bengkel</label>
                            <select
                              className="mt-1 w-full h-10 bg-black border border-zinc-800 text-white px-3 rounded-lg text-sm"
                              value={slotInfo.status}
                              onChange={(e) => setSlotInfo((prev: any) => ({ ...prev, status: e.target.value }))}
                            >
                              <option value="Open">Buka (Open)</option>
                              <option value="Closed">Tutup (Closed)</option>
                            </select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white rounded-xl py-5 mt-4">
                          Perbarui Jadwal Slot
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Slot Details Display */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Rincian Slot Tanggal: {slotDate}</CardTitle>
                      <CardDescription className="text-zinc-400">Ringkasan utilisasi antrean pada tanggal yang Anda pilih.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black p-4 rounded-xl border border-zinc-800 text-center">
                          <span className="text-xs text-zinc-500 block">Slot Terisi</span>
                          <strong className="text-3xl font-extrabold text-white">{slotInfo.kapasitasTerpakai}</strong>
                          <span className="text-[10.5px] text-zinc-400 mt-1 block">Sepeda Motor terdaftar</span>
                        </div>
                        <div className="bg-black p-4 rounded-xl border border-zinc-800 text-center">
                          <span className="text-xs text-zinc-500 block">Sisa Kuota Slot</span>
                          <strong className="text-3xl font-extrabold text-primary">
                            {Math.max(0, slotInfo.kapasitasMax - slotInfo.kapasitasTerpakai)}
                          </strong>
                          <span className="text-[10.5px] text-zinc-400 mt-1 block">Slot tersedia</span>
                        </div>
                      </div>

                      <div className="bg-black p-4 rounded-xl border border-zinc-800 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Persentase Keterisian:</span>
                          <strong className="text-zinc-200">
                            {((slotInfo.kapasitasTerpakai / slotInfo.kapasitasMax) * 100).toFixed(0)}%
                          </strong>
                        </div>
                        <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${(slotInfo.kapasitasTerpakai / slotInfo.kapasitasMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Live Notification Logs Drawer Widget) */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-24 shadow-2xl">
              <CardHeader className="border-b border-zinc-800 pb-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary animate-bounce" /> Live Broadcast Log
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-400">Simulasi Notifikasi Real-time ke Pelanggan</CardDescription>
                </div>
                <Badge variant="default" className="text-[8px] bg-red-600 text-white uppercase font-bold animate-pulse">Live</Badge>
              </CardHeader>
              <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
                {notificationLogs.length === 0 ? (
                  <div className="flex flex-col justify-center items-center py-10 text-center text-zinc-650 gap-2">
                    <Bell className="h-8 w-8 text-zinc-800" />
                    <p className="text-[10.5px] italic text-zinc-600">Menunggu aktivitas admin untuk memicu siaran notifikasi...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notificationLogs.map((log, idx) => (
                      <div key={idx} className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 text-[10.5px] text-zinc-350 leading-relaxed font-mono">
                        {log}
                      </div>
                    ))}
                    <div className="text-[9px] text-zinc-500 text-center font-sans mt-2 pt-2 border-t border-zinc-850">
                      * Catatan mekanik & status tersinkronisasi via SMS/WhatsApp API.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
