"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
        phone,
        callbackURL: "/auth/login",
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/login");
            router.refresh();
          },
          onError: (ctx: any) => {
            setErrorMsg(ctx.error.message || "Gagal mendaftarkan akun. Silakan coba lagi.");
          },
        },
      } as any);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
        <CardHeader className="space-y-1 items-center text-center">
          <div className="bg-primary/20 p-3 rounded-full mb-2">
            <Wrench className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
          <CardDescription className="text-zinc-400">
            Lengkapi data di bawah ini untuk membuat akun SixtySixGarage
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                className="bg-black border-zinc-800 text-white placeholder-zinc-600 rounded-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="08123456789" 
                required 
                className="bg-black border-zinc-800 text-white placeholder-zinc-600 rounded-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                className="bg-black border-zinc-800 text-white placeholder-zinc-600 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                minLength={8} 
                className="bg-black border-zinc-800 text-white rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-zinc-500">Minimal 8 karakter</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white rounded-lg py-5" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>
            <div className="text-sm text-center text-zinc-400">
              Sudah punya akun?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
