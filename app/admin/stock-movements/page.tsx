"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  RotateCcw,
  Hash,
  Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { useStockMovements } from "@/hooks/useStockMovements";
import { StockMovement } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const movementConfig: Record<string, { label: string; color: string; icon: any }> = {
  in: { label: "Stok Girişi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: ArrowDownLeft },
  out: { label: "Stok Çıkışı", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: ArrowUpRight },
  order: { label: "Sipariş Düşümü", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: ShoppingCart },
  return: { label: "İade Girişi", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: RotateCcw },
};

const referenceLabels: Record<string, string> = {
  order: "Sipariş",
  supplierreceipt: "Tedarikçi İrsaliyesi / Mal Kabul",
  orderreturn: "Sipariş İadesi",
  waste: "Fire / Hasarlı Ürün",
  audit: "Depo Sayımı",
  adjustment: "Stok Düzeltme",
  manual: "Manuel İşlem",
};

function formatReferenceType(type?: string): string {
  if (!type) return "";
  const key = type.toLowerCase().replace(/[^a-z]/g, "");
  return referenceLabels[key] || type;
}

export default function StockMovementsPage() {
  const { data: session } = useSession();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const { data, isLoading, isFetching, refetch } = useStockMovements(
    page,
    pageSize,
    debouncedSearch,
    typeFilter
  );
  const movements: StockMovement[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const totalRecords: number = Array.isArray(data) 
    ? data.length 
    : ((data as any)?.totalRecords ?? (data as any)?.TotalRecords ?? movements.length);
  const totalPages: number = (data as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: "id",
      header: "Kayıt No",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "productVariantId",
      header: "Varyant ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Varyant #{row.original.productVariantId}</span>
        </div>
      ),
    },
    {
      accessorKey: "movementType",
      header: "İşlem Türü",
      cell: ({ row }) => {
        const typeKey = (row.original.movementType || "").toLowerCase();
        const conf = movementConfig[typeKey] || {
          label: row.original.movementType || "Bilinmiyor",
          color: "bg-muted text-muted-foreground",
          icon: Boxes,
        };
        const Icon = conf.icon;
        return (
          <Badge variant="outline" className={`gap-1.5 py-1 px-2.5 ${conf.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {conf.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Miktar",
      cell: ({ row }) => {
        const qty = row.original.quantity || 0;
        const isPositive = qty > 0;
        return (
          <span className={`font-mono font-bold text-sm ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isPositive ? `+${qty}` : qty} Adet
          </span>
        );
      },
    },
    {
      accessorKey: "stockChange",
      header: "Stok Değişimi (Önce → Sonra)",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-muted-foreground">{row.original.previousStock}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-foreground">{row.original.currentStock}</span>
        </div>
      ),
    },
    {
      accessorKey: "note",
      header: "Referans & Açıklama",
      cell: ({ row }) => {
        const refType = row.original.referenceType;
        const refId = row.original.referenceId;
        const note = row.original.note;
        return (
          <div className="space-y-0.5">
            {refType && (
              <div className="text-xs font-medium text-primary">
                {formatReferenceType(refType)} {refId ? `(#${refId})` : ""}
              </div>
            )}
            <div className="text-xs text-muted-foreground truncate max-w-xs">{note || "-"}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdDate",
      header: "Tarih",
      cell: ({ row }) => {
        const date = (row.original as any).createdDate || (row.original as any).createdAt;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{date ? new Date(date).toLocaleString("tr-TR") : "-"}</span>
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
              <BreadcrumbPage>Stok Hareketleri</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* İşlem Türü Filtre Butonları */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <Button
          variant={typeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("all")}
        >
          Tüm Hareketler
        </Button>
        <Button
          variant={typeFilter === "IN" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("IN")}
          className="gap-1.5"
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" /> Giriş
        </Button>
        <Button
          variant={typeFilter === "OUT" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("OUT")}
          className="gap-1.5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Çıkış
        </Button>
        <Button
          variant={typeFilter === "ORDER" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("ORDER")}
          className="gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-blue-500" /> Sipariş Düşümü
        </Button>
        <Button
          variant={typeFilter === "RETURN" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("RETURN")}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5 text-purple-500" /> İade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Stok hareketleri yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movements}
          showSearch={true}
          searchPlaceholder="Açıklama veya Referans Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="hareket"
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}
    </div>
  );
}
