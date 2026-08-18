"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, User as UserIcon, Mail, Phone } from "lucide-react";
import { UserDialog } from "@/components/admin/user-dialog";
import { useUsers, User } from "@/hooks/useUsers";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedUser(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { query, createMutation, updateMutation, deleteMutation } = useUsers(page, pageSize, debouncedSearch);
  const { data: rawData, isLoading, isFetching, refetch } = query;
  const users: User[] = Array.isArray(rawData) ? rawData : (rawData as any)?.data || [];
  const totalRecords: number = Array.isArray(rawData)
    ? rawData.length
    : ((rawData as any)?.totalRecords ?? (rawData as any)?.TotalRecords ?? users.length);
  const totalPages: number = (rawData as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setToDelete(null),
    });
  };

  const onSubmit = (formData: any) => {
    if (selectedUser) {
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

  const columns: ColumnDef<User>[] = [
    {
      id: "fullName",
      header: "Ad Soyad",
      accessorFn: (row) => row.fullName || row.FullName || "",
      cell: ({ row }) => {
        const name = row.original.fullName || row.original.FullName || "İsimsiz Kullanıcı";
        const uid = row.original.userId ?? row.original.UserId ?? row.original.id;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">{name}</div>
              <div className="text-xs text-muted-foreground">ID: #{uid}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      header: "E-posta",
      accessorFn: (row) => row.email || row.Email || "",
      cell: ({ row }) => {
        const email = row.original.email || row.original.Email;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{email || "-"}</span>
          </div>
        );
      },
    },
    {
      id: "mobilePhones",
      header: "Telefon",
      accessorFn: (row) => row.mobilePhones || row.MobilePhones || "",
      cell: ({ row }) => {
        const phone = row.original.mobilePhones || row.original.MobilePhones;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{phone || "-"}</span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Durum",
      accessorFn: (row) => (row.status !== undefined ? row.status : row.Status),
      cell: ({ row }) => {
        const status = row.original.status !== undefined ? row.original.status : row.original.Status;
        return (
          <Badge variant={status ? "default" : "destructive"}>
            {status ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(user)}
              title="Düzenle"
            >
              <Edit2 className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setToDelete(user)}
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
        
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Kullanıcılar yükleniyor...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          showSearch={true}
          searchPlaceholder="Ad Soyad, E-posta veya Telefon Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="kullanıcı"
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={() => refetch()} 
          isRefreshing={isFetching}
        />
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedUser}
        isPending={isPending}
        onSubmit={onSubmit}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.fullName || toDelete?.FullName || toDelete?.email}&quot; kullanıcısı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const uid = toDelete?.userId ?? toDelete?.UserId ?? toDelete?.id;
                if (uid) handleDelete(uid);
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