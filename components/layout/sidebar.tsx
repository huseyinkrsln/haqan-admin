"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Users, Settings, PieChart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Finance",
    path: "/admin/finance",
    icon: PieChart,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const filteredRoutes = routes.filter((route) =>
    route.roles.includes(userRole)
  );

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen hidden md:block">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold font-playfair text-primary">Admin Panel</h1>
      </div>
      <nav className="p-4 space-y-2">
        {filteredRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname.startsWith(route.path);
          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span>{route.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
