"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, LogOut, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <nav className="border-b border-zinc-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              Sixty6<span className="text-primary">Garage</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Beranda
            </Link>
            <Link href="/booking" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Booking Service
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </Link>
            {/* Tautan ke Admin Dashboard, HANYA MUNCUL JIKA USER ADALAH ADMIN BENGKEL */}
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-primary text-primary font-bold border-l border-zinc-800 pl-4 animate-pulse">
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {isPending ? (
              <span className="text-xs text-zinc-500 font-mono">Memuat sesi...</span>
            ) : session?.user ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <User className="h-3.5 w-3.5 text-primary" /> {session.user.name}
                  {isAdmin && <span className="text-[9px] bg-red-600/30 text-red-400 border border-red-500/20 px-1 rounded">Admin</span>}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-1 h-9 rounded-lg"
                >
                  <LogOut className="h-3.5 w-3.5" /> Keluar
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white">Masuk</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-primary hover:bg-red-700 text-white rounded-lg">Daftar</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}
