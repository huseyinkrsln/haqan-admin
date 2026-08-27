"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingCart, Eye, Trash2, Clock, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { useCarts, useDeleteCart } from "@/hooks/useCarts";
import { Cart } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CartDetailDialog } from "@/components/admin/cart-detail-dialog";
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

export default function CartsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Cart | null>(null);
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

  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useCarts(page, pageSize, debouncedSearch);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["cart-items"] });
  };
  const carts: Cart[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const totalRecords: number = Array.isArray(data)
    ? data.length
    : ((data as any)?.totalRecords ?? (data as any)?.TotalRecords ?? carts.length);
  const totalPages: number = (data as any)?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

  const deleteMutation = useDeleteCart();

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setToDelete(null),
    });
  };

  const columns: ColumnDef<Cart>[] = [
    {
      accessorKey: "id",
      header: "Sepet ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "userId",
      header: "Müşteri / Kullanıcı",
      cell: ({ row }) => {
        const cart = row.original;
        const uid = cart.userId;
        if (!uid) {
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Misafir Ziyaretçi</span>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {cart.userFullName || `Müşteri #${uid}`}
              </div>
              {cart.userEmail && (
                <div className="text-xs text-muted-foreground">
                  {cart.userEmail}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Son Geçerlilik",
      cell: ({ row }) => {
        const exp = row.original.expiresAt;
        const isExpired = exp ? new Date(exp) < new Date() : false;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isExpired ? "destructive" : "default"} className="text-xs">
              {isExpired ? "Süresi Doldu" : "Aktif"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {exp ? new Date(exp).toLocaleDateString("tr-TR") : "-"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCart(cart);
                setDetailOpen(true);
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5" /> İncele
            </Button>
            {role !== "VIEWER" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                onClick={() => setToDelete(cart)}
                title="Sepeti Sil"
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
              <BreadcrumbPage>Aktif Sepetler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Sepetler yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={carts}
          showSearch={true}
          searchPlaceholder="Müşteri adı, e-posta veya sepet ID ile ara..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecords={totalRecords}
          totalLabel="sepet"
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
        />
      )}

      {/* Sepet Detay Modalı */}
      <CartDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        cart={selectedCart}
      />

      {/* Sepet Silme Onay Modalı */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sepeti silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              #{toDelete?.id} numaralı sepet ve içerisindeki ürünler kalıcı olarak silinecektir.
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
