"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Heart,
  User as UserIcon,
  Package,
  Mail,
  Calendar,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import {
  useFavorites,
  useOutfitFavorites,
  useFavoriteCounts,
} from "@/hooks/useFavorites";
import { ProductFavorite, OutfitFavorite } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { getMinioUrl } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"products" | "outfits">("products");

  // ─── 0. FAVORİ SAYAÇLARI (AYRI VE HIZLI ENDPOINT) ───
  const { data: counts, refetch: refetchCounts } = useFavoriteCounts();

  // ─── 1. ÜRÜN FAVORİLERİ STATE ───
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productPage, setProductPage] = useState<number>(1);
  const [productPageSize, setProductPageSize] = useState<number>(10);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const {
    data: productData,
    isLoading: isProductLoading,
    isFetching: isProductFetching,
    refetch: refetchProducts,
  } = useFavorites(productPage, productPageSize, debouncedProductSearch, {
    enabled: activeTab === "products",
  });

  const productFavorites: ProductFavorite[] = Array.isArray(productData)
    ? productData
    : (productData as any)?.data || [];
  const productTotalRecords: number = Array.isArray(productData)
    ? productData.length
    : ((productData as any)?.totalRecords ??
      (productData as any)?.TotalRecords ??
      productFavorites.length);
  const productTotalPages: number =
    (productData as any)?.totalPages ??
    Math.max(1, Math.ceil(productTotalRecords / productPageSize));

  // ─── 2. KOMBİN FAVORİLERİ STATE ───
  const [outfitSearch, setOutfitSearch] = useState("");
  const [debouncedOutfitSearch, setDebouncedOutfitSearch] = useState("");
  const [outfitPage, setOutfitPage] = useState<number>(1);
  const [outfitPageSize, setOutfitPageSize] = useState<number>(10);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedOutfitSearch(outfitSearch);
      setOutfitPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [outfitSearch]);

  const {
    data: outfitData,
    isLoading: isOutfitLoading,
    isFetching: isOutfitFetching,
    refetch: refetchOutfits,
  } = useOutfitFavorites(outfitPage, outfitPageSize, debouncedOutfitSearch, {
    enabled: activeTab === "outfits",
  });

  const outfitFavorites: OutfitFavorite[] = Array.isArray(outfitData)
    ? outfitData
    : (outfitData as any)?.data || [];
  const outfitTotalRecords: number = Array.isArray(outfitData)
    ? outfitData.length
    : ((outfitData as any)?.totalRecords ??
      (outfitData as any)?.TotalRecords ??
      outfitFavorites.length);
  const outfitTotalPages: number =
    (outfitData as any)?.totalPages ??
    Math.max(1, Math.ceil(outfitTotalRecords / outfitPageSize));

  // ─── ÜRÜN TABLOSU SÜTUNLARI ───
  const productColumns: ColumnDef<ProductFavorite>[] = [
    {
      accessorKey: "id",
      header: "Kayıt No",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      id: "product",
      header: "Favorilenen Ürün",
      cell: ({ row }) => {
        const item = row.original;
        const imgUrl = getMinioUrl(item.imageUrl);

        return (
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/products/${item.productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-12 w-12 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition-all group"
              title="Ürün Detay Sayfasını Yeni Sekmede Aç"
            >
              {imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={item.productName || "Ürün"}
                  fill
                  sizes="48px"
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/products/${item.productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm hover:text-primary hover:underline transition-colors inline-flex items-center gap-1 text-foreground"
                  title="Ürün Detay Sayfasını Yeni Sekmede Aç"
                >
                  <span>{item.productName || `Ürün #${item.productId}`}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary shrink-0" />
                </Link>
              </div>
              <div className="text-xs text-muted-foreground">
                Ürün ID: #{item.productId}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Ürün Fiyatı",
      cell: ({ row }) => {
        const price = Number(row.original.price) || 0;
        return (
          <span className="font-semibold text-sm">
            {price > 0
              ? `₺${price.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}`
              : "-"}
          </span>
        );
      },
    },
    {
      id: "user",
      header: "Müşteri",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {item.userFullName || `Müşteri #${item.userId}`}
              </div>
              {item.userEmail && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{item.userEmail}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdDate",
      header: "Eklenme Tarihi",
      cell: ({ row }) => {
        const dateStr = row.original.createdDate;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {dateStr
                ? new Date(dateStr).toLocaleDateString("tr-TR")
                : "-"}
            </span>
          </div>
        );
      },
    },
  ];

  // ─── KOMBİN TABLOSU SÜTUNLARI ───
  const outfitColumns: ColumnDef<OutfitFavorite>[] = [
    {
      accessorKey: "id",
      header: "Kayıt No",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      id: "outfit",
      header: "Favorilenen Kombin",
      cell: ({ row }) => {
        const item = row.original;
        const imgUrl = getMinioUrl(item.coverImageUrl);

        return (
          <div className="flex items-center gap-3">
            <Link
              href="/admin/outfits"
              className="relative h-14 w-12 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition-all group"
              title="Kombin Yönetimine Git"
            >
              {imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={item.outfitTitle || "Kombin"}
                  fill
                  sizes="48px"
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
              ) : (
                <Sparkles className="h-5 w-5 text-amber-500" />
              )}
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Link
                  href="/admin/outfits"
                  className="font-semibold text-sm hover:text-primary hover:underline transition-colors inline-flex items-center gap-1 text-foreground"
                  title="Kombin Yönetimine Git"
                >
                  <span>
                    {item.outfitTitle || `Kombin #${item.outfitId}`}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary shrink-0" />
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] px-1.5 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5 text-amber-300" />
                  Kombin Seti
                </Badge>
                {item.itemCount !== undefined && item.itemCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-900 border-emerald-300 bg-emerald-50 px-1.5 py-0"
                  >
                    {item.itemCount} Parça
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground ml-1">
                  Kombin ID: #{item.outfitId}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Kombin Paket Fiyatı",
      cell: ({ row }) => {
        const price = Number(row.original.price) || 0;
        return (
          <span className="font-semibold text-sm text-emerald-900">
            {price > 0
              ? `₺${price.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}`
              : "-"}
          </span>
        );
      },
    },
    {
      id: "user",
      header: "Müşteri",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {item.userFullName || `Müşteri #${item.userId}`}
              </div>
              {item.userEmail && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{item.userEmail}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdDate",
      header: "Eklenme Tarihi",
      cell: ({ row }) => {
        const dateStr = row.original.createdDate;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {dateStr
                ? new Date(dateStr).toLocaleDateString("tr-TR")
                : "-"}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Müşteri Favorileri</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 🌟 SEÇKİN TAB BAŞLIKLARI (ÜRÜNLER & KOMBİNLER) 🌟 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl border w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              activeTab === "products"
                ? "bg-white text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Ürün Favorileri</span>
            {(counts?.productFavoritesCount ?? productTotalRecords) > 0 && (
              <Badge
                variant={activeTab === "products" ? "secondary" : "outline"}
                className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
              >
                {counts?.productFavoritesCount ?? productTotalRecords}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outfits")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              activeTab === "outfits"
                ? "bg-white text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Kombin Favorileri</span>
            {(counts?.outfitFavoritesCount ?? outfitTotalRecords) > 0 && (
              <Badge
                variant={activeTab === "outfits" ? "secondary" : "outline"}
                className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
              >
                {counts?.outfitFavoritesCount ?? outfitTotalRecords}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ÜRÜN FAVORİLERİ TABLOSU ─── */}
      {activeTab === "products" && (
        <>
          {isProductLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Spinner size="lg" className="mb-4" />
              <p>Ürün favorileri yükleniyor...</p>
            </div>
          ) : (
            <DataTable
              columns={productColumns}
              data={productFavorites}
              showSearch={true}
              searchPlaceholder="Ürün adı veya müşteri ile ara..."
              searchValue={productSearch}
              onSearchChange={setProductSearch}
              totalRecords={productTotalRecords}
              totalLabel="ürün favorisi"
              page={productPage}
              pageSize={productPageSize}
              pageCount={productTotalPages}
              onPageChange={setProductPage}
              onPageSizeChange={setProductPageSize}
              onRefresh={() => {
                refetchProducts();
                refetchCounts();
              }}
              isRefreshing={isProductFetching}
            />
          )}
        </>
      )}

      {/* ─── TAB 2: KOMBİN FAVORİLERİ TABLOSU ─── */}
      {activeTab === "outfits" && (
        <>
          {isOutfitLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Spinner size="lg" className="mb-4" />
              <p>Kombin favorileri yükleniyor...</p>
            </div>
          ) : (
            <DataTable
              columns={outfitColumns}
              data={outfitFavorites}
              showSearch={true}
              searchPlaceholder="Kombin adı veya müşteri ile ara..."
              searchValue={outfitSearch}
              onSearchChange={setOutfitSearch}
              totalRecords={outfitTotalRecords}
              totalLabel="kombin favorisi"
              page={outfitPage}
              pageSize={outfitPageSize}
              pageCount={outfitTotalPages}
              onPageChange={setOutfitPage}
              onPageSizeChange={setOutfitPageSize}
              onRefresh={() => {
                refetchOutfits();
                refetchCounts();
              }}
              isRefreshing={isOutfitFetching}
            />
          )}
        </>
      )}
    </div>
  );
}
