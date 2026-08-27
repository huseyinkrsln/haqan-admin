"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/useBrands";
import { Brand, CreateBrandDto, UpdateBrandDto } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BrandDialog } from "@/components/admin/brand-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getApiErrorMessage } from "@/lib/utils";

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || "http://127.0.0.1:9000";

function getMinioUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${MINIO_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function BrandsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [toDelete, setToDelete] = useState<Brand | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useBrands();
  
  // Güvenli dizi alma (backend'den DTO içinde dönerse)
  const brands: Brand[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const handleSubmit = (data: any) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data }, {
        onSuccess: () => {
          toast.success("Marka güncellendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getApiErrorMessage(err, "Marka güncellenirken hata oluştu."))
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Marka başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getApiErrorMessage(err, "Marka eklenirken hata oluştu."))
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Marka başarıyla silindi.");
        setToDelete(null);
      },
      onError: (err: any) => {
        toast.error(getApiErrorMessage(err, "Marka silinirken hata oluştu."), { duration: 6000 });
        setToDelete(null);
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "logoUrl",
      header: "Logo",
      cell: ({ row }) => {
        const url = row.original.logoUrl;
        return url ? (
          <div className="w-10 h-10 bg-white border rounded p-1 flex items-center justify-center">
            <img src={getMinioUrl(url)} alt={row.original.name} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Yok</span>
        );
      },
    },
    { accessorKey: "name", header: "Marka Adı" },
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
              <BreadcrumbPage>Markalar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Marka Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Markalar yükleniyor...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={brands} onRefresh={() => refetch()} isRefreshing={isFetching} />
      )}

      <BrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!deleteMutation.isPending && !open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu markayı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; markası kalıcı olarak silinecek.
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
