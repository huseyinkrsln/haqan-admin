"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function UsersPage() {
  const { data: users, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axiosInstance.get<User[]>("/users");
      return res.data;
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "İsim",
    },
    {
      accessorKey: "email",
      header: "E-posta",
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === "SUPER_ADMIN" ? "default" : role === "EDITOR" ? "secondary" : "outline"}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
            {status === "ACTIVE" ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
  ];

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
              <BreadcrumbPage>Kullanıcılar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Kullanıcılar yükleniyor...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users || []} 
          onRefresh={() => refetch()} 
          isRefreshing={isFetching}
        />
      )}
    </div>
  );
}