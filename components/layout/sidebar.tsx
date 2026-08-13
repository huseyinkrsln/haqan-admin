"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Package, Settings, CreditCard, ChevronLeft, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "GUEST";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      title: "Ürünler",
      href: "/admin/products",
      icon: Package,
      roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
    },
    {
      title: "Kullanıcılar",
      href: "/admin/users",
      icon: Users,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: "Finans",
      href: "/admin/finance",
      icon: CreditCard,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: "Ayarlar",
      href: "/admin/settings",
      icon: Settings,
      roles: ["SUPER_ADMIN", "EDITOR"],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out h-screen sticky top-0 hidden md:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border", isCollapsed ? "justify-center px-0" : "justify-between px-6")}>
        {!isCollapsed && (
          <Link href="/admin" className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <Logo className="w-32 text-primary" />
          </Link>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed ? "mx-auto" : "ml-auto")}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-all duration-300", isCollapsed ? "mr-0" : "mr-3")} />
              <span 
                className={cn(
                  "truncate transition-all duration-300", 
                  isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}