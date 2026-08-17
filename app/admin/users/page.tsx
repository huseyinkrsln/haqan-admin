"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { GenericCrudDialog } from "@/components/admin/generic-crud-dialog";
import { useUsers, User } from "@/hooks/useUsers";

const FIELDS = [
  { key: "FullName", label: "Ad Soyad", placeholder: "Ahmet Yılmaz", required: true },
  { key: "Email", label: "E-posta", placeholder: "ahmet@ornek.com", required: true },
  { key: "MobilePhones", label: "Telefon", placeholder: "05xx xxx xx xx", required: false },
  // Şifre sadece oluştururken gösterilmeli
];

export default function UsersPage() {
  const { query, createMutation, updateMutation, deleteMutation } = useUsers();
  const { data: users, isLoading, isFetching, refetch } = query;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Oluştururken şifre alanı ekle, düzenlerken çıkarma
  const currentFields = selectedUser
    ? FIELDS
    : [...FIELDS, { key: "password", label: "Şifre", placeholder: "••••••", required: true }];

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData: any) => {
    if (selectedUser) {
      updateMutation.mutate(
        { ...selectedUser, ...formData },
        {
          onSuccess: () => setDialogOpen(false),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "FullName",
      header: "Ad Soyad",
    },
    {
      accessorKey: "Email",
      header: "E-posta",
    },
    {
      accessorKey: "MobilePhones",
      header: "Telefon",
    },
    {
      accessorKey: "Status",
      header: "Durum",
      cell: ({ row }) => {
        const status = row.getValue("Status") as boolean;
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEdit(user)}
              className="h-8 w-8"
              title="Düzenle"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(user.UserId)}
              className="h-8 w-8"
              title="Sil"
              disabled={deleteMutation.isPending}
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
          data={users || []} 
          onRefresh={() => refetch()} 
          isRefreshing={isFetching}
        />
      )}

      <GenericCrudDialog<User>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={selectedUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
        fields={currentFields}
        initialData={selectedUser}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={onSubmit}
      />
    </div>
  );
}