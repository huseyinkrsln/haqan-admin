"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ShieldCheck, Plus, Edit, Trash2, Key } from "lucide-react";
import { useSession } from "next-auth/react";

import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/useRoles";
import { Role } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { RoleDialog } from "@/components/admin/role-dialog";
import { RolePermissionsDialog } from "@/components/admin/role-permissions-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function RolesPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedRole(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useRoles();
  const roles: Role[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const handleCreate = () => {
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (r: Role) => {
    setSelectedRole(r);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setToDelete(null),
    });
  };

  const onSubmit = (formData: any) => {
    if (selectedRole) {
      updateMutation.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "id",
      header: "Rol ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">#{row.original.id}</span>
      ),
    },
    {
      id: "groupName",
      header: "Rol Adı",
      accessorFn: (row) => row.groupName || row.GroupName || "",
      cell: ({ row }) => {
        const name = row.original.groupName || row.original.GroupName || "-";
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPermissionsRole(r)}
              className="gap-1.5 h-8 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
              title="Rol İzinlerini Yönet"
            >
              <Key className="h-3.5 w-3.5" /> Yetkileri Yönet
            </Button>
            {role === "SUPER_ADMIN" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(r)}
                  className="h-8 w-8"
                  title="Düzenle"
                >
                  <Edit className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => setToDelete(r)}
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Roller & İzinler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role === "SUPER_ADMIN" && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Rol Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Roller yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={roles}
          showSearch={true}
          searchPlaceholder="Rol Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={roles.length}
          totalLabel="rol"
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      {/* Rol Düzenleme / Ekleme Modalı */}
      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedRole}
        isPending={isPending}
        onSubmit={onSubmit}
      />

      {/* Rol İzinleri Yönetim Modalı */}
      <RolePermissionsDialog
        open={!!permissionsRole}
        onOpenChange={(open) => {
          if (!open) setPermissionsRole(null);
        }}
        role={permissionsRole}
      />

      {/* Silme Onay Modalı */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolü silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.groupName || toDelete?.GroupName}&quot; rolü sistemden kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) handleDelete(toDelete.id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
