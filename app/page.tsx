import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, PenTool, Calendar, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-24 px-4 md:px-8 text-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black z-0 pointer-events-none" />
        <div className="z-10 max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Performa Maksimal untuk <span className="text-primary">Motor Kesayangan</span> Anda
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto">
            Booking service tanpa antri, dapatkan rekomendasi oli terbaik dengan algoritma cerdas, dan ketahui estimasi biaya secara transparan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/booking">
              <Button size="lg" className="w-full sm:w-auto font-semibold group">
                Booking Sekarang
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#fitur">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary text-primary hover:bg-primary/10">
                Pelajari Fitur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4 md:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mengapa Memilih Sixty6<span className="text-primary">Garage</span>?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Sistem cerdas kami dirancang untuk memberikan kemudahan, kecepatan, dan transparansi dalam perawatan motor Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-primary/50 transition-colors">
              <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Bebas Antre</h3>
              <p className="text-zinc-400">Pilih jadwal service yang sesuai dengan waktu Anda. Kami membatasi kuota harian untuk memastikan motor Anda langsung dikerjakan.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-primary/50 transition-colors">
              <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <PenTool className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Rekomendasi Cerdas (SAW)</h3>
              <p className="text-zinc-400">Bingung pilih oli? Sistem kami menggunakan metode Simple Additive Weighting untuk merekomendasikan oli terbaik sesuai jenis motor, CC, dan budget Anda.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-primary/50 transition-colors">
              <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Estimasi Transparan</h3>
              <p className="text-zinc-400">Pilih service dan sparepart yang dibutuhkan. Dapatkan estimasi biaya di awal sehingga Anda bisa menyiapkan budget tanpa kejutan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-8 bg-black border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Cara Kerja <span className="text-primary">Sistem Kami</span></h2>
            <div className="space-y-6">
              {[
                "Isi data kendaraan dan pilih jadwal service.",
                "Tambahkan sparepart yang ingin diganti (Opsional).",
                "Dapatkan rekomendasi oli cerdas menggunakan metode SAW.",
                "Konfirmasi pesanan dan lihat estimasi total biaya.",
                "Datang ke bengkel tepat waktu dan bayar di kasir!"
              ].map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-4">
                    {index + 1}
                  </div>
                  <p className="text-lg text-zinc-300 mt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pattern-dots pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="text-primary h-6 w-6" />
                <div>
                  <h4 className="font-semibold text-white">Service Berkala</h4>
                  <p className="text-sm text-zinc-400">Estimasi Jasa: Rp 150.000</p>
                </div>
              </div>
              <div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="text-primary h-6 w-6" />
                <div>
                  <h4 className="font-semibold text-white">Kampas Rem Depan</h4>
                  <p className="text-sm text-zinc-400">Estimasi: Rp 85.000</p>
                </div>
              </div>
              <div className="bg-black border border-primary/40 p-4 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="text-primary h-6 w-6" />
                <div>
                  <h4 className="font-semibold text-white">Motul 5100 10W-40</h4>
                  <p className="text-sm text-zinc-400">Rekomendasi SAW #1 • Rp 185.000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
