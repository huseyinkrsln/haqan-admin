"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Mail } from "lucide-react";

import { Logo } from "@/components/ui/logo";

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
      router.push("/admin/products");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sol Marka Kısmı */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-start">
          <Logo className="w-48 text-primary-foreground items-start" />
          <p className="mt-6 text-primary-foreground/80 font-medium">Premium E-Ticaret Yönetimi</p>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl leading-tight mb-4">
            Koleksiyonlarınızı zarafet ve hassasiyetle yönetin.
          </h2>
          <p className="text-primary-foreground/70">
            Tüm yönetim ekibiniz için envanter, siparişler ve sistem ayarlarını denetlemek adına güvenli erişim.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Yönetici Girişi
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Haqan Wear yönetim paneline erişmek için bilgilerinizi girin.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@haqanwear.com" 
                    className="pl-10 h-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:-translate-y-1"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {isLoading ? "Giriş yapılıyor..." : "Yönetici Olarak Giriş Yap"}
            </Button>
          </form>
          
          <div className="mt-8 flex flex-col gap-4 text-center lg:text-left">
            <p className="text-sm text-muted-foreground">
              Yönetici hesabınız yok mu?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Kayıt olun
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Giriş yaparak, Haqan Wear Yönetim Paneli Hizmet Şartlarını kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}