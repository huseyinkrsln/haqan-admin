"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axiosInstance.get<User[]>("/users");
      return res.data;
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
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
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Active" ? "outline" : "destructive"}>
            {status}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-playfair">System Users</h2>
        <p className="text-muted-foreground">
          Manage system administrators and their roles.
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">Loading users...</div>
      ) : (
        <DataTable columns={columns} data={users || []} />
      )}
    </div>
  );
}
