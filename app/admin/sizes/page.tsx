"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useSizes, useCreateSize, useUpdateSize, useDeleteSize } from "@/hooks/useSizes";
import { Size, CreateSizeDto, UpdateSizeDto } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { GenericCrudDialog } from "@/components/admin/generic-crud-dialog";
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

const FIELDS = [
  { key: "name", label: "Beden Adı", placeholder: "XL", required: true },
  { key: "sizeGroup", label: "Beden Grubu", placeholder: "Üst Giyim", required: true },
];

export default function SizesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Size | null>(null);
  const [toDelete, setToDelete] = useState<Size | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data: sizes = [], isLoading, isFetching, refetch } = useSizes();
  const createMutation = useCreateSize();
  const updateMutation = useUpdateSize();
  const deleteMutation = useDeleteSize();

  const handleSubmit = (data: Omit<Size, "id">) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data } as UpdateSizeDto, {
        onSuccess: () => {
          toast.success("Beden güncellendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Beden güncellenirken hata oluştu.")
      });
    } else {
      createMutation.mutate(data as CreateSizeDto, {
        onSuccess: () => {
          toast.success("Beden başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Beden eklenirken hata oluştu.")
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Beden silindi.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Beden silinirken hata oluştu.");
        setToDelete(null);
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Size>[] = [
    { accessorKey: "name", header: "Beden" },
    {
      accessorKey: "sizeGroup",
      header: "Grup",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.sizeGroup}</Badge>
      ),
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        if (role === "VIEWER") return null;
        const item = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDialogOpen(true); }} title="Düzenle">
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setToDelete(item)} title="Sil">
              <Trash2 className="h-4 w-4" />
            </Button>
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
              <BreadcrumbPage>Bedenler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Beden Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Bedenler yükleniyor...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={sizes} onRefresh={() => refetch()} isRefreshing={isFetching} />
      )}

      <GenericCrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={selected ? "Bedeni Düzenle" : "Yeni Beden Ekle"}
        description={selected ? "Beden bilgilerini güncelleyin." : "Sisteme yeni bir beden ekleyin."}
        fields={FIELDS}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!deleteMutation.isPending && !open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu bedeni silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; bedeni kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (toDelete) handleDelete(toDelete.id); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <><Spinner size="sm" className="mr-2" />Siliniyor...</> : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
