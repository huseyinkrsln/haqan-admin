"use client";

import { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Eye,
  Trash2,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useOrders, useDeleteOrder, useUpdateOrder, useOrderCounts } from "@/hooks/useOrders";
import { Order, OrderStatusEnum } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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

const statusConfig: Record<string, { label: string; color: string; icon: any; enumValue: OrderStatusEnum }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock, enumValue: OrderStatusEnum.Pending },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Package, enumValue: OrderStatusEnum.Processing },
  shipped: { label: "Kargolandı", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: Truck, enumValue: OrderStatusEnum.Shipped },
  delivered: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2, enumValue: OrderStatusEnum.Delivered },
  cancelled: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: XCircle, enumValue: OrderStatusEnum.Cancelled },
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatusEnum | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Arama için 300ms debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleStatusFilterChange = (status: OrderStatusEnum | "all") => {
    setStatusFilter(status);
    setPage(1);
  };

  // Server-side sorgu
  const currentStatusParam = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading, isFetching, refetch } = useOrders(page, pageSize, currentStatusParam, debouncedSearch);
  
  // Sunucu tabanlı durum sayaçları (Server-Side Group By Counts)
  const { data: countsData } = useOrderCounts();
  const counts = countsData || { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };

  const deleteMutation = useDeleteOrder();
  const updateMutation = useUpdateOrder();

  const orders: Order[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const totalRecords: number = Array.isArray(data) 
    ? data.length 
    : ((data as any)?.totalRecords ?? (data as any)?.TotalRecords ?? orders.length);
  const totalPages: number = (data as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Sipariş silindi.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Sipariş silinirken hata oluştu.");
        setToDelete(null);
      },
    });
  };

  const handleQuickStatusChange = (order: Order, newStatusKey: string) => {
    // Map status key to PascalCase e.g. "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
    const capitalized = newStatusKey.charAt(0).toUpperCase() + newStatusKey.slice(1);
    updateMutation.mutate(
      {
        ...order,
        orderStatus: capitalized,
      },
      {
        onSuccess: () => {
          toast.success(`Sipariş #${order.orderNumber || order.id} durumu güncellendi.`);
        },
        onError: () => {
          toast.error("Durum güncellenirken hata oluştu.");
        },
      }
    );
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Sipariş No",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-semibold text-primary">
          #{row.original.orderNumber || row.original.id}
        </div>
      ),
    },
    {
      accessorKey: "shippingFullName",
      header: "Müşteri / İletişim",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.shippingFullName || "Misafir Müşteri"}</div>
          <div className="text-xs text-muted-foreground">{row.original.shippingPhoneNumber || "-"}</div>
        </div>
      ),
    },
    {
      accessorKey: "orderDate",
      header: "Sipariş Tarihi",
      cell: ({ row }) => {
        const date = row.original.orderDate;
        return (
          <span className="text-xs text-muted-foreground">
            {date ? new Date(date).toLocaleString("tr-TR") : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Tutar",
      cell: ({ row }) => (
        <span className="font-semibold text-sm">
          ₺{(row.original.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: "orderStatus",
      header: "Durum",
      cell: ({ row }) => {
        const order = row.original;
        const statusKey = (order.orderStatus || "").toLowerCase();
        const conf = statusConfig[statusKey] || {
          label: order.orderStatus || "Bilinmiyor",
          color: "bg-muted text-muted-foreground border-muted-foreground/20",
          icon: Package,
          enumValue: OrderStatusEnum.All,
        };
        const Icon = conf.icon;

        if (role === "VIEWER") {
          return (
            <Badge variant="outline" className={`gap-1.5 py-1 px-2.5 ${conf.color}`}>
              <Icon className="h-3.5 w-3.5" />
              {conf.label}
            </Badge>
          );
        }

        return (
          <Select
            value={statusKey}
            onValueChange={(val) => handleQuickStatusChange(order, val)}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger
              className={`h-7.5 w-auto min-w-[130px] border gap-1.5 py-1 px-2.5 text-xs font-medium rounded-full cursor-pointer hover:opacity-90 transition-opacity ${conf.color} focus:ring-1`}
              title="Durumu Hızlıca Değiştir"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{conf.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="pending" className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Beklemede
                </span>
              </SelectItem>
              <SelectItem value="processing" className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Hazırlanıyor
                </span>
              </SelectItem>
              <SelectItem value="shipped" className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Kargolandı
                </span>
              </SelectItem>
              <SelectItem value="delivered" className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Teslim Edildi
                </span>
              </SelectItem>
              <SelectItem value="cancelled" className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  İptal Edildi
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-primary hover:bg-primary/10"
              onClick={() => {
                setSelectedOrder(item);
                setDetailOpen(true);
              }}
              title="Detay ve Durum Güncelle"
            >
              <Eye className="h-4 w-4" />
              <span>İncele</span>
            </Button>
            {role !== "VIEWER" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setToDelete(item)}
                title="Siparişi Sil"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
              <BreadcrumbPage>Siparişler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Durum Filtreleme Butonları (Server-Side Enum) */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange("all")}
          className="gap-2"
        >
          Tümü <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.total}</Badge>
        </Button>
        <Button
          variant={statusFilter === OrderStatusEnum.Pending ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(OrderStatusEnum.Pending)}
          className="gap-2"
        >
          <Clock className="h-3.5 w-3.5 text-amber-500" /> Beklemede
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.pending}</Badge>
        </Button>
        <Button
          variant={statusFilter === OrderStatusEnum.Processing ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(OrderStatusEnum.Processing)}
          className="gap-2"
        >
          <Package className="h-3.5 w-3.5 text-blue-500" /> Hazırlanıyor
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.processing}</Badge>
        </Button>
        <Button
          variant={statusFilter === OrderStatusEnum.Shipped ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(OrderStatusEnum.Shipped)}
          className="gap-2"
        >
          <Truck className="h-3.5 w-3.5 text-purple-500" /> Kargolandı
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.shipped}</Badge>
        </Button>
        <Button
          variant={statusFilter === OrderStatusEnum.Delivered ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(OrderStatusEnum.Delivered)}
          className="gap-2"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Teslim Edildi
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.delivered}</Badge>
        </Button>
        <Button
          variant={statusFilter === OrderStatusEnum.Cancelled ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(OrderStatusEnum.Cancelled)}
          className="gap-2"
        >
          <XCircle className="h-3.5 w-3.5 text-rose-500" /> İptal
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{counts.cancelled}</Badge>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Siparişler yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          showSearch={true}
          searchPlaceholder="Sipariş No, Müşteri Adı veya Tel Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="sipariş"
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      {/* Sipariş Detay & Durum Modalı */}
      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selectedOrder}
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
            <AlertDialogTitle>Siparişi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              #{toDelete?.orderNumber || toDelete?.id} numaralı sipariş kaydı kalıcı olarak silinecek.
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
