"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { ProductWizardDialog } from "@/components/admin/product-wizard-dialog";
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
import { RefreshCw } from "lucide-react";
import {
  useProducts,
  useCreateComplexProduct,
  useDeleteProduct,
  useProductPagination,
} from "@/hooks/useProducts";
import { Product, CreateComplexProductDto } from "@/types/api.types";

export default function ProductsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const { page, take, goToPage, goToNext, goToPrev, changePageSize } =
    useProductPagination();

  const {
    data: paginated,
    isLoading,
    isFetching,
    refetch,
  } = useProducts({ page, take });

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

  // Filtrelenmiş ürünler (client-side arama, server pagination ile birlikte)
  const filtered = search
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.slug?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

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
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>İndirimli Fiyat</TableHead>
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
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {search ? "Arama sonucu bulunamadı." : "Henüz ürün eklenmedi."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product, idx) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {(page - 1) * take + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(product.basePrice)}
                      </TableCell>
                      <TableCell>
                        {product.discountPrice ? (
                          <span className="text-green-600 font-medium">
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
                      <TableCell>{product.displayOrder}</TableCell>
                      {role !== "VIEWER" && (
                        <TableCell className="text-right">
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
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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