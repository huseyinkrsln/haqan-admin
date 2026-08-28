"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useColors, useCreateColor, useUpdateColor, useDeleteColor } from "@/hooks/useColors";
import { Color, CreateColorDto, UpdateColorDto } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  { key: "name", label: "Renk Adı", placeholder: "Siyah", required: true },
  {
    key: "hexCode",
    label: "HEX Kodu",
    placeholder: "#000000",
    required: true,
    type: "color" as const,
  },
];

export default function ColorsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Color | null>(null);
  const [toDelete, setToDelete] = useState<Color | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: colors = [], isLoading, isFetching, refetch } = useColors();
  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor();
  const deleteMutation = useDeleteColor();

  const handleSubmit = (data: Omit<Color, "id">) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data } as UpdateColorDto, {
        onSuccess: () => {
          toast.success("Renk güncellendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || err.message || "Renk güncellenirken hata oluştu.";
          toast.error(typeof msg === "string" ? msg : "Renk güncellenirken hata oluştu.");
        }
      });
    } else {
      createMutation.mutate(data as CreateColorDto, {
        onSuccess: () => {
          toast.success("Renk başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || err.message || "Renk eklenirken hata oluştu.";
          toast.error(typeof msg === "string" ? msg : "Renk eklenirken hata oluştu.");
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Renk silindi.");
        setToDelete(null);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || err.message || "Renk silinirken hata oluştu.";
        toast.error(typeof msg === "string" ? msg : "Renk silinirken hata oluştu.");
        setToDelete(null);
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnDef<Color>[] = [
    {
      accessorKey: "hexCode",
      header: "Renk",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: row.original.hexCode }}
          />
          <span className="text-xs text-muted-foreground font-mono">
            {row.original.hexCode}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    { accessorKey: "name", header: "Renk Adı" },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        if (role === "VIEWER") return null;
        const item = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setSelected(item); setDialogOpen(true); }}
              title="Düzenle"
            >
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setToDelete(item)}
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

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
              <BreadcrumbPage>Renkler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Renk Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Renkler yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={colors}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      <GenericCrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={selected ? "Rengi Düzenle" : "Yeni Renk Ekle"}
        description={selected ? "Renk bilgilerini güncelleyin." : "Sisteme yeni bir renk ekleyin."}
        fields={FIELDS}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

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
              Rengi Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{toDelete?.name}&quot;</strong> rengini silmek üzeresiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-xs text-muted-foreground my-1">
            Bu işlem rengi sistemden kaldıracaktır. Eğer bu renge bağlı ürünler bulunuyorsa silme işlemi engellenecektir.
          </p>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (toDelete) handleDelete(toDelete.id); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Spinner size="sm" className="mr-2" />Siliniyor...</>
              ) : "Evet, Rengi Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
