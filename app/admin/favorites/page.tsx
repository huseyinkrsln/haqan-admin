"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Heart, User as UserIcon, Package, Mail, Calendar, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { useFavorites } from "@/hooks/useFavorites";
import { ProductFavorite } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
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

  const { data, isLoading, isFetching, refetch } = useFavorites(page, pageSize, debouncedSearch);
  const favorites: ProductFavorite[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const totalRecords: number = Array.isArray(data)
    ? data.length
    : ((data as any)?.totalRecords ?? (data as any)?.TotalRecords ?? favorites.length);
  const totalPages: number = (data as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const columns: ColumnDef<ProductFavorite>[] = [
    {
      accessorKey: "id",
      header: "Kayıt No",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
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
              className="relative h-12 w-12 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition-all group"
              title="Ürün Detay Sayfasına Git"
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
                  className="font-semibold text-sm hover:text-primary hover:underline transition-colors inline-flex items-center gap-1 text-foreground"
                  title="Ürün Detay Sayfasına Git"
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
            {price > 0 ? `₺${price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
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
            <span>{dateStr ? new Date(dateStr).toLocaleDateString("tr-TR") : "-"}</span>
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
              <BreadcrumbPage>Favori Ürünler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Favori istatistikleri yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={favorites}
          showSearch={true}
          searchPlaceholder="Favori Ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="favori"
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
