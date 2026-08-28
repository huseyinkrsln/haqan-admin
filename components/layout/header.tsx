"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Store,
  ExternalLink,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role || "SUPER_ADMIN";
  const fullName = user?.name || user?.fullName || "Yönetici";
  const email = user?.email || "admin@haqanwear.com";

  // Initials for avatar
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3001";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-30 shadow-2xs">
      {/* Sol: Mağazayı Gör Butonu */}
      <div className="flex items-center gap-3">
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-all hover:border-primary/40 shadow-2xs group"
          title="Müşteri Vitrinini Yeni Sekmede Aç"
        >
          <Store className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span>Mağazayı Gör</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      </div>

      {/* Sağ: Zengin Kullanıcı & Çıkış Kartı */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-3 p-1.5 pr-2.5 rounded-full hover:bg-muted/60 border border-transparent hover:border-border transition-all cursor-pointer outline-none group"
              />
            }
          >
            {/* Avatar Dairesi */}
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-background group-hover:scale-105 transition-transform">
              {initials}
            </div>

            {/* İsim ve Rol */}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight text-foreground flex items-center gap-1.5">
                <span>{fullName}</span>
                <Badge
                  variant={role === "SUPER_ADMIN" ? "default" : role === "EDITOR" ? "secondary" : "outline"}
                  className="text-[9px] py-0 px-1 font-mono tracking-tight"
                >
                  {role}
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate max-w-[140px]">
                {email}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-0.5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5">
            {/* Başlık Kullanıcı Özeti */}
            <div className="p-2 border-b mb-1">
              <p className="text-xs font-semibold text-foreground">{fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{email}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3 w-3" />
                <span>Yetki: {role}</span>
              </div>
            </div>

            <DropdownMenuGroup>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/profile" className="flex items-center gap-2 w-full px-2 py-1.5 text-xs">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Profil Bilgilerim</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-destructive" />
              <span>Güvenli Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}