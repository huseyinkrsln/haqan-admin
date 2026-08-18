"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, Truck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import {
  useShippingCarriers,
  useCreateShippingCarrier,
  useUpdateShippingCarrier,
  useDeleteShippingCarrier,
} from "@/hooks/useShippingCarriers";
import { ShippingCarrier } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ShippingCarrierDialog } from "@/components/admin/shipping-carrier-dialog";
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

export default function ShippingCarriersPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ShippingCarrier | null>(null);
  const [toDelete, setToDelete] = useState<ShippingCarrier | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching, refetch } = useShippingCarriers(debouncedSearch);
  const carriers: ShippingCarrier[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateShippingCarrier();
  const updateMutation = useUpdateShippingCarrier();
  const deleteMutation = useDeleteShippingCarrier();

  const handleSubmit = (formData: any) => {
    if (selected) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Kargo firması güncellendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Kargo firması güncellenirken hata oluştu."),
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Kargo firması başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Kargo firması eklenirken hata oluştu."),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Kargo firması silindi.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Kargo firması silinirken hata oluştu.");
        setToDelete(null);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<ShippingCarrier>[] = [
    {
      accessorKey: "name",
      header: "Firma Adı",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">ID: #{row.original.id}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "basePrice",
      header: "Standart Kargo Ücreti",
      cell: ({ row }) => {
        const price = row.original.basePrice;
        return (
          <span className="font-mono font-medium text-sm">
            {price !== undefined && price > 0 ? `₺${price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Ücretsiz"}
          </span>
        );
      },
    },
    {
      accessorKey: "trackingUrlTemplate",
      header: "Takip URL Şablonu",
      cell: ({ row }) => {
        const template = row.original.trackingUrlTemplate;
        return template ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono truncate max-w-sm">
            <span className="truncate">{template}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Şablon tanımlanmamış</span>
        );
      },
    },
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
              onClick={() => {
                setSelected(item);
                setDialogOpen(true);
              }}
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
              <BreadcrumbPage>Kargo Firmaları</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Firma Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Kargo firmaları yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={carriers}
          showSearch={true}
          searchPlaceholder="Kargo Firması Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      <ShippingCarrierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kargo firmasını silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; firması sistemden kalıcı olarak silinecektir.
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
