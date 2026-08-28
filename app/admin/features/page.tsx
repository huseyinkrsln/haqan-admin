"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature } from "@/hooks/useFeatures";
import { Feature } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FeatureDialog } from "@/components/admin/feature-dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
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

import { getMinioUrl } from "@/lib/utils";

export default function FeaturesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [toDelete, setToDelete] = useState<Feature | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useFeatures();
  
  // Güvenli dizi alma (backend'den DTO içinde dönerse)
  const features: Feature[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();

  const handleSubmit = (data: any) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data }, {
        onSuccess: () => {
          toast.success("Özellik güncellendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || err.message || "Özellik güncellenirken hata oluştu.";
          toast.error(typeof msg === "string" ? msg : "Özellik güncellenirken hata oluştu.");
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Özellik başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || err.message || "Özellik eklenirken hata oluştu.";
          toast.error(typeof msg === "string" ? msg : "Özellik eklenirken hata oluştu.");
        }
      });
    }
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Özellik silindi.");
        setToDelete(null);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || err.message || "Özellik silinirken hata oluştu.";
        toast.error(typeof msg === "string" ? msg : "Özellik silinirken hata oluştu.");
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Feature>[] = [
    {
      accessorKey: "icon",
      header: "İkon",
      cell: ({ row }) => {
        const url = row.original.icon;
        return url ? (
          <div className="w-8 h-8 bg-white border rounded p-1 flex items-center justify-center">
            <img src={getMinioUrl(url)} alt={row.original.name} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Yok</span>
        );
      },
    },
    { accessorKey: "name", header: "Özellik Adı" },
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
              <BreadcrumbPage>Özellikler (Features)</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Özellik Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Özellikler yükleniyor...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={features} onRefresh={() => refetch()} isRefreshing={isFetching} />
      )}

      <FeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

      {/* ─── ALERT: Özellik Silme Onayı ─────────────────────────────────────── */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setToDelete(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Özelliği Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{toDelete?.name}&quot;</strong> özelliğini silmek üzeresiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-xs text-muted-foreground my-1">
            Bu işlem özelliği sistemden kaldıracaktır. Eğer bu özelliğe bağlı ürünler bulunuyorsa silme işlemi engellenecektir.
          </p>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
                "Evet, Özelliği Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
