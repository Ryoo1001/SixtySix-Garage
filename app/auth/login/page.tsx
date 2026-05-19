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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
        fetchOptions: {
          onSuccess: () => {
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx: any) => {
            setErrorMsg(ctx.error.message || "Gagal masuk. Periksa kembali email dan password Anda.");
          },
        },
      });
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
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Masuk ke Akun Anda</CardTitle>
          <CardDescription className="text-zinc-400">
            Masukkan email dan password untuk melanjutkan ke SixtySixGarage
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                className="bg-black border-zinc-800 text-white rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white rounded-lg py-5" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
            <div className="text-sm text-center text-zinc-400">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Daftar sekarang
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
