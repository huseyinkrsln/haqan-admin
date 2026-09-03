"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  CreditCard,
  ChevronLeft,
  Menu,
  Palette,
  Ruler,
  Tag,
  BadgeCheck,
  List,
  ShoppingBag,
  TicketPercent,
  Image as ImageIcon,
  Truck,
  Boxes,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Plus,
  MessageSquareWarning,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
  exact?: boolean;
  canAdd?: boolean;
  addHref?: string;
  addTitle?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "GUEST";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
      exact: true,
    },
    {
      title: "Siparişler",
      href: "/admin/orders",
      icon: ShoppingBag,
      roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
    },
    {
      title: "Ürünler",
      href: "/admin/products",
      icon: Package,
      roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
      canAdd: true,
      addHref: "/admin/products?action=new",
      addTitle: "Yeni Ürün Ekle",
    },
    {
      title: "Kategoriler",
      href: "/admin/categories",
      icon: List,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/categories?action=new",
      addTitle: "Yeni Kategori Ekle",
    },
    {
      title: "Markalar",
      href: "/admin/brands",
      icon: Tag,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/brands?action=new",
      addTitle: "Yeni Marka Ekle",
    },
    {
      title: "Kuponlar",
      href: "/admin/coupons",
      icon: TicketPercent,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/coupons?action=new",
      addTitle: "Yeni Kupon Oluştur",
    },
    {
      title: "Slider & Banner",
      href: "/admin/sliders",
      icon: ImageIcon,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/sliders?action=new",
      addTitle: "Yeni Banner Ekle",
    },
    {
      title: "Kargo Firmaları",
      href: "/admin/shipping-carriers",
      icon: Truck,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/shipping-carriers?action=new",
      addTitle: "Yeni Kargo Firması Ekle",
    },
    {
      title: "Stok Hareketleri",
      href: "/admin/stock-movements",
      icon: Boxes,
      roles: ["SUPER_ADMIN", "EDITOR"],
    },
    {
      title: "Aktif Sepetler",
      href: "/admin/carts",
      icon: ShoppingCart,
      roles: ["SUPER_ADMIN", "EDITOR"],
    },
    {
      title: "Favori Ürünler",
      href: "/admin/favorites",
      icon: Heart,
      roles: ["SUPER_ADMIN", "EDITOR"],
    },
    {
      title: "Şikayet & Öneriler",
      href: "/admin/complaint-suggestions",
      icon: MessageSquareWarning,
      roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
    },
    {
      title: "Renkler",
      href: "/admin/colors",
      icon: Palette,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/colors?action=new",
      addTitle: "Yeni Renk Tanımla",
    },
    {
      title: "Bedenler",
      href: "/admin/sizes",
      icon: Ruler,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/sizes?action=new",
      addTitle: "Yeni Beden Tanımla",
    },
    {
      title: "Özellikler",
      href: "/admin/features",
      icon: BadgeCheck,
      roles: ["SUPER_ADMIN", "EDITOR"],
      canAdd: true,
      addHref: "/admin/features?action=new",
      addTitle: "Yeni Özellik Ekle",
    },
    {
      title: "Kullanıcılar",
      href: "/admin/users",
      icon: Users,
      roles: ["SUPER_ADMIN"],
      canAdd: true,
      addHref: "/admin/users?action=new",
      addTitle: "Yeni Kullanıcı Ekle",
    },
    {
      title: "Roller & İzinler",
      href: "/admin/roles",
      icon: ShieldCheck,
      roles: ["SUPER_ADMIN"],
      canAdd: true,
      addHref: "/admin/roles?action=new",
      addTitle: "Yeni Rol Ekle",
    },
    {
      title: "Site Ayarları",
      href: "/admin/site-settings",
      icon: Settings,
      roles: ["SUPER_ADMIN", "EDITOR"],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out h-screen sticky top-0 hidden md:flex select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border transition-all", isCollapsed ? "justify-center px-0" : "justify-between px-5")}>
        {!isCollapsed ? (
          <>
            <Link href="/admin" className="flex items-center gap-2.5 shrink-0 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                HQ
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-lg font-bold tracking-[0.14em] text-foreground leading-none">
                  HAQAN
                </span>
                <span className="text-[9px] tracking-[0.3em] text-primary font-bold uppercase mt-1">
                  WEAR
                </span>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCollapsed(true)}
              className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Menüyü Daralt"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            title="Menüyü Genişlet"
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
          >
            <span className="group-hover:opacity-0 transition-opacity">HQ</span>
            <Menu className="h-4 w-4 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  "flex items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </Link>
            );
          }

          return (
            <div
              key={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link
                href={item.href}
                className="flex items-center flex-1 min-w-0 py-0.5"
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 mr-3 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>

              {item.canAdd && (
                <Link
                  href={item.addHref!}
                  title={item.addTitle || "Yeni Ekle"}
                  className={cn(
                    "shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ml-1.5",
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/30 hover:scale-105 active:scale-95"
                      : "bg-muted/70 text-muted-foreground/75 hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-2xs"
                  )}
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}