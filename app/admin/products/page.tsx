"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Eye, PackagePlus, Boxes, RefreshCw } from "lucide-react";
import { ProductWizardDialog } from "@/components/admin/product-wizard-dialog";
import { QuickStockDialog } from "@/components/admin/quick-stock-dialog";
import { toast } from "sonner";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  useProducts,
  useCreateComplexProduct,
  useDeleteProduct,
  useProductPagination,
} from "@/hooks/useProducts";
import { Product, CreateComplexProductDto } from "@/types/api.types";

import { getMinioUrl } from "@/lib/utils";

export default function ProductsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [stockModalProductId, setStockModalProductId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [search, setSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const { page, take, goToPage, goToNext, goToPrev, changePageSize } =
    useProductPagination();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsWizardOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
      goToPage(1);
    }
  }, [urlSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      goToPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data: paginated,
    isLoading,
    isFetching,
    refetch,
  } = useProducts({ page, take, search: debouncedSearch });

  const products: Product[] = paginated?.data ?? [];
  const totalPages = paginated?.totalPages ?? 0;
  const totalRecords = paginated?.totalRecords ?? 0;

  const createMutation = useCreateComplexProduct();
  const deleteMutation = useDeleteProduct();

  const handleWizardSubmit = (data: CreateComplexProductDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Ürün başarıyla eklendi.");
        setIsWizardOpen(false);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data || "Ürün eklenirken bir hata oluştu.";
        toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Ürün sistemden silindi.");
        setProductToDelete(null);
      },
      onError: () => {
        toast.error("Ürün silinirken bir hata oluştu.");
        setProductToDelete(null);
      },
    });
  };

  const filtered = products;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Action */}
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
              <BreadcrumbPage>Ürünler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => setIsWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
          </Button>
        )}
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Ürünler yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Yenile"
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Input
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <span className="ml-auto text-sm text-muted-foreground">
              Toplam: <strong>{totalRecords}</strong> ürün
            </span>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Ürün Bilgisi</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>İndirimli Fiyat</TableHead>
                  <TableHead>Stok Durumu</TableHead>
                  <TableHead>Etiketler</TableHead>
                  <TableHead>Sıra</TableHead>
                  {role !== "VIEWER" && (
                    <TableHead className="text-right">İşlemler</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {search ? "Arama sonucu bulunamadı." : "Henüz ürün eklenmedi."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product, idx) => {
                    const imgUrl = product.primaryImageUrl ? getMinioUrl(product.primaryImageUrl) : "";
                    const totalStock = product.totalStock ?? 0;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {(page - 1) * take + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 py-0.5">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
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
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate max-w-[220px]" title={product.name}>
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono text-[11px] truncate max-w-[120px]">{product.slug}</span>
                                {product.categoryName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[11px] font-medium text-primary">{product.categoryName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(product.basePrice)}
                        </TableCell>
                        <TableCell>
                          {product.discountPrice ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              }).format(product.discountPrice)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setStockModalProductId(product.id)}
                            className="group inline-flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                            title="Hızlı Stok Yönetimi & Ekle"
                          >
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs font-bold gap-1 py-1 px-2.5 transition-all group-hover:ring-1 group-hover:ring-primary/40 ${
                                totalStock === 0
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                  : totalStock < 10
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              <Boxes className="h-3 w-3 shrink-0" />
                              {totalStock === 0 ? "Tükendi (0)" : `${totalStock} Adet`}
                            </Badge>
                            <PackagePlus className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {product.isFeatured && (
                              <Badge variant="outline" className="text-[11px] font-semibold bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
                                ★ Öne Çıkan
                              </Badge>
                            )}
                            {product.isBestSeller && (
                              <Badge variant="outline" className="text-[11px] font-semibold bg-rose-50 text-rose-800 border-rose-300 shadow-2xs">
                                🔥 Çok Satan
                              </Badge>
                            )}
                            {product.isNewArrival && (
                              <Badge variant="outline" className="text-[11px] font-semibold bg-indigo-50 text-indigo-800 border-indigo-300 shadow-2xs">
                                ✨ Yeni Gelen
                              </Badge>
                            )}
                            {!product.isFeatured && !product.isBestSeller && !product.isNewArrival && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.displayOrder}</TableCell>
                        {role !== "VIEWER" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-8 w-8"
                                onClick={() => setStockModalProductId(product.id)}
                                title="Hızlı Stok Ekle & Yönet"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </Button>
                              <Link href={`/admin/products/${product.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8"
                                  title="Detay & Düzenle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                onClick={() => setProductToDelete(product)}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sayfada göster:</span>
                <select
                  className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none"
                  value={take}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Sayfa <strong>{page}</strong> / <strong>{totalPages}</strong>
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrev}
                    disabled={page <= 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNext}
                    disabled={page >= totalPages || isFetching}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stock Dialog */}
      <QuickStockDialog
        productId={stockModalProductId}
        open={!!stockModalProductId}
        onOpenChange={(open) => {
          if (!open) setStockModalProductId(null);
        }}
      />

      {/* Wizard Dialog */}
      <ProductWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSubmit={handleWizardSubmit}
        isPending={createMutation.isPending}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bu ürünü silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{productToDelete?.name}&quot; adlı ürün sistemden kalıcı
              olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (productToDelete) handleDelete(productToDelete.id);
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