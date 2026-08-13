"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ProfilePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "MİSAFİR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profilim</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="bg-card border rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center shrink-0">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Admin Kullanıcısı</h3>
          <p className="text-muted-foreground">admin@haqan.com</p>
          <div className="pt-2">
            <Badge variant={role === "SUPER_ADMIN" ? "default" : "outline"}>{role}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
