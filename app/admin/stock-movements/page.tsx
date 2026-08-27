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
  Sliders,
  Trash2,
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

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || "http://127.0.0.1:9000";

function getMinioUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${MINIO_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const movementConfig: Record<string, { label: string; color: string; icon: any }> = {
  in: { label: "Stok Girişi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: ArrowDownLeft },
  "1": { label: "Stok Girişi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: ArrowDownLeft },
  out: { label: "Stok Çıkışı", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: ArrowUpRight },
  "2": { label: "Stok Çıkışı", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: ArrowUpRight },
  order: { label: "Sipariş Düşümü", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: ShoppingCart },
  "3": { label: "Sipariş Düşümü", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: ShoppingCart },
  return: { label: "İade Girişi", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: RotateCcw },
  "4": { label: "İade Girişi", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: RotateCcw },
  adjustment: { label: "Sayım Düzeltmesi", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Sliders },
  "5": { label: "Sayım Düzeltmesi", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Sliders },
  waste: { label: "Fire / Hasar", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20", icon: Trash2 },
  "6": { label: "Fire / Hasar", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20", icon: Trash2 },
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
  const key = type.toLowerCase().replace(/[^a-z0-9]/g, "");
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
        <span className="font-mono text-xs font-semibold text-muted-foreground">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "productInfo",
      header: "Ürün & Varyant",
      cell: ({ row }) => {
        const item = row.original;
        const productName = item.productName || (item.productId ? `Ürün #${item.productId}` : `Varyant #${item.productVariantId}`);
        const hasVariantDetails = Boolean(item.colorName || item.sizeName);
        const imgUrl = item.productImageUrl ? getMinioUrl(item.productImageUrl) : "";

        return (
          <div className="flex items-center gap-3 py-0.5">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={productName}
                className="h-10 w-10 rounded-md object-cover border shrink-0 bg-muted"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-muted/60 border flex items-center justify-center shrink-0 text-muted-foreground">
                <Boxes className="h-4 w-4 opacity-50" />
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="font-semibold text-sm leading-none text-foreground truncate max-w-[240px]" title={productName}>
                {productName}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {item.colorName && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-[11px] font-medium border border-border/50">
                    {item.colorHexCode && (
                      <span
                        className="h-2 w-2 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: item.colorHexCode }}
                      />
                    )}
                    {item.colorName}
                  </span>
                )}

                {item.sizeName && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 text-[11px] font-bold border border-border/50">
                    {item.sizeName}
                  </span>
                )}

                {!hasVariantDetails && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    #{item.productVariantId}
                  </span>
                )}

                {item.barcode && (
                  <span className="text-[10px] font-mono text-muted-foreground/80 hidden sm:inline" title="Barkod">
                    ({item.barcode})
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "movementType",
      header: "İşlem Türü",
      cell: ({ row }) => {
        const typeKey = String(row.original.movementType || "").trim().toLowerCase();
        const conf = movementConfig[typeKey] || {
          label: row.original.movementType ? String(row.original.movementType) : "Bilinmiyor",
          color: "bg-muted text-muted-foreground",
          icon: Boxes,
        };
        const Icon = conf.icon;
        return (
          <Badge variant="outline" className={`gap-1.5 py-1 px-2.5 font-medium ${conf.color}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {conf.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Miktar",
      cell: ({ row }) => {
        const prev = Number(row.original.previousStock ?? 0);
        const curr = Number(row.original.currentStock ?? 0);
        const diff = curr - prev;
        const typeKey = String(row.original.movementType || "").trim().toLowerCase();
        
        // Stok farkından ya da hareket tipinden artış/azalış tespiti
        const isDecrease = diff < 0 || (diff === 0 && ["out", "order", "waste", "2", "3", "6"].includes(typeKey));
        const isIncrease = diff > 0 || (diff === 0 && ["in", "return", "1", "4"].includes(typeKey));
        const displayQty = Math.abs(diff !== 0 ? diff : Number(row.original.quantity || 0));

        if (isIncrease) {
          return (
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              +{displayQty} Adet
            </span>
          );
        }

        if (isDecrease) {
          return (
            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
              -{displayQty} Adet
            </span>
          );
        }

        return (
          <span className="font-mono font-bold text-sm text-muted-foreground">
            {displayQty} Adet
          </span>
        );
      },
    },
    {
      accessorKey: "stockChange",
      header: "Stok Değişimi (Önce → Sonra)",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-muted-foreground font-medium">{row.original.previousStock}</span>
          <span className="text-muted-foreground text-xs">→</span>
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
          <div className="space-y-0.5 max-w-sm">
            {refType && (
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                <span>{formatReferenceType(refType)}</span>
                {refId && <span className="text-muted-foreground font-normal">(#{refId})</span>}
              </div>
            )}
            <div className="text-xs text-muted-foreground truncate" title={note || ""}>{note || "-"}</div>
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
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
          variant={typeFilter === "In" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("In")}
          className="gap-1.5"
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" /> Giriş
        </Button>
        <Button
          variant={typeFilter === "Out" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("Out")}
          className="gap-1.5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Çıkış
        </Button>
        <Button
          variant={typeFilter === "Order" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("Order")}
          className="gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-blue-500" /> Sipariş Düşümü
        </Button>
        <Button
          variant={typeFilter === "Return" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("Return")}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5 text-purple-500" /> İade
        </Button>
        <Button
          variant={typeFilter === "Adjustment" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("Adjustment")}
          className="gap-1.5"
        >
          <Sliders className="h-3.5 w-3.5 text-amber-500" /> Sayım Düzeltmesi
        </Button>
        <Button
          variant={typeFilter === "Waste" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilterChange("Waste")}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Fire / Hasar
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
