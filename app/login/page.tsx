"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", { 
      email, 
      password, 
      redirect: false
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error !== "CredentialsSignin" ? result.error : "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } else {
      toast.success("Başarıyla giriş yapıldı!");
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d0b] text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#4A5D3E] selection:text-white">
      
      {/* ─── AMBIENT ARKA PLAN IŞIKLARI ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4A5D3E]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2f3d28]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Geometrik İnce Arka Plan Dokusu */}
      <div className="absolute inset-0 bg-[radial-gradient(#4A5D3E_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      {/* ─── MERKEZİ LÜKS GİRİŞ KARTI (Obsidian Glassmorphism) ─── */}
      <div className="w-full max-w-md bg-zinc-900/85 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-8 sm:p-11 shadow-[0_25px_80px_rgba(0,0,0,0.8)] relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header: Gerçek HQ Logosu */}
        <div className="text-center space-y-3 mb-8">
          <div className="relative inline-block mx-auto">
            <Image
              src="/icons/icon-192x192.png"
              alt="HAQAN"
              width={72}
              height={72}
              className="rounded-2xl shadow-xl mx-auto"
              priority
            />
          </div>
          
          <div>
            <span className="font-playfair text-2xl font-bold tracking-[0.2em] text-white uppercase block">
              HAQAN WEAR
            </span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#a3b899] font-semibold block mt-1">
              YÖNETİM MERKEZİ
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-light">
            Koleksiyon ve sistem yönetimi için güvenli erişim
          </p>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            
            {/* E-Posta */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block" htmlFor="email">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@haqanwear.com" 
                  className="pl-10 h-11 bg-zinc-950/70 border-zinc-800 focus:border-[#4A5D3E] focus:ring-1 focus:ring-[#4A5D3E] text-white placeholder:text-zinc-600 rounded-xl text-sm" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block" htmlFor="password">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-zinc-950/70 border-zinc-800 focus:border-[#4A5D3E] focus:ring-1 focus:ring-[#4A5D3E] text-white placeholder:text-zinc-600 rounded-xl text-sm" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Giriş Butonu */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-xs font-bold uppercase tracking-[0.2em] bg-[#4A5D3E] hover:bg-[#3D4D33] text-white shadow-lg shadow-[#4A5D3E]/20 transition-all hover:-translate-y-0.5 rounded-xl cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Doğrulanıyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Giriş Yap</span>
                <ArrowRight size={15} />
              </span>
            )}
          </Button>
        </form>
        
        {/* Alt Bilgiler ve Güvenlik Rozeti */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck size={14} className="text-[#a3b899]" />
            <span>256-Bit SSL Korumalı Yönetici Paneli</span>
          </div>

          <p className="text-xs text-zinc-500">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-[#a3b899] hover:underline font-semibold">
              Kayıt Olun
            </Link>
          </p>
        </div>

      </div>

      {/* Alt Telif */}
      <div className="absolute bottom-4 text-center text-[10px] text-zinc-600 tracking-wider uppercase">
        © 2026 HAQAN Wear • Tüm Hakları Saklıdır
      </div>
    </div>
  );
}