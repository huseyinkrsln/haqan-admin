"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, TicketPercent, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "@/hooks/useCoupons";
import { Coupon, CreateCouponDto, UpdateCouponDto } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CouponDialog } from "@/components/admin/coupon-dialog";
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

export default function CouponsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  // Arama için 300ms debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching, refetch } = useCoupons(page, pageSize, debouncedSearch);
  const coupons: Coupon[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const totalRecords: number = Array.isArray(data) 
    ? data.length 
    : ((data as any)?.totalRecords ?? (data as any)?.TotalRecords ?? coupons.length);
  const totalPages: number = (data as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const handleSubmit = (formData: any) => {
    if (selected) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Kupon güncellendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Kupon güncellenirken hata oluştu."),
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Kupon başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Kupon eklenirken hata oluştu."),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Kupon silindi.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Kupon silinirken hata oluştu.");
        setToDelete(null);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: "Kupon Kodu",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-sm font-bold tracking-wider px-3 py-1 bg-primary/10 text-primary border-primary/20">
          <TicketPercent className="h-3.5 w-3.5 mr-1.5" />
          {row.original.code}
        </Badge>
      ),
    },
    {
      accessorKey: "discountType",
      header: "İndirim Türü & Değeri",
      cell: ({ row }) => {
        const isPercentage = row.original.discountType === "Percentage";
        return (
          <div>
            <div className="font-semibold text-sm">
              {isPercentage ? `%${row.original.value} İndirim` : `₺${row.original.value} İndirim`}
            </div>
            <div className="text-xs text-muted-foreground">
              {isPercentage ? "Yüzdelik Oran" : "Sabit Tutar"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "minOrderAmount",
      header: "Min. Sepet Tutarı",
      cell: ({ row }) => {
        const amount = row.original.minOrderAmount;
        return amount > 0 ? (
          <span className="text-sm font-medium">₺{amount.toLocaleString("tr-TR")}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Alt Limit Yok</span>
        );
      },
    },
    {
      accessorKey: "validity",
      header: "Geçerlilik Tarihleri",
      cell: ({ row }) => {
        const now = new Date();
        const start = new Date(row.original.startDate);
        const end = new Date(row.original.endDate);
        const isExpired = now > end;
        const notStarted = now < start;

        return (
          <div className="space-y-1">
            <div className="text-xs">
              {start.toLocaleDateString("tr-TR")} - {end.toLocaleDateString("tr-TR")}
            </div>
            {isExpired ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" /> Süresi Doldu
              </Badge>
            ) : notStarted ? (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                Başlamadı
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-1">
                <CheckCircle className="h-3 w-3" /> Aktif
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isShowcase",
      header: "Vitrin Durumu",
      cell: ({ row }) => {
        const isShowcase = Boolean(row.original.isShowcase);
        return isShowcase ? (
          <Badge variant="default" className="bg-[#4A5D3E] hover:bg-[#3D4D33] text-white text-[11px] gap-1 shadow-xs">
            🌟 Vitrinde Yayında
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        // if (role === "VIEWER") return null;
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
              <BreadcrumbPage>Kuponlar & İndirimler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* {role !== "VIEWER" && ( */}
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Kupon Ekle
          </Button>
        {/* )} */}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Kuponlar yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={coupons}
          showSearch={true}
          searchPlaceholder="Kupon Kodu Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="kupon"
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      <CouponDialog
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
            <AlertDialogTitle>Kuponu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.code}&quot; kuponu kalıcı olarak silinecektir.
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
