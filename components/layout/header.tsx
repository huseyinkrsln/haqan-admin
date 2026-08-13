"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "MİSAFİR";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
      </div>

      <div className="flex items-center space-x-4">
        <Badge variant={role === "SUPER_ADMIN" ? "default" : role === "EDITOR" ? "secondary" : "outline"}>
          {role}
        </Badge>

        <Link href="/admin/profile">
          <Button variant="ghost" size="icon" className="rounded-full" title="Profilim">
            <User className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" 
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Çıkış Yap"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}