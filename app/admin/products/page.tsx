"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProductDialog, Product } from "@/components/admin/product-dialog";
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

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data: products, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get<Product[]>("/products");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      const res = await axiosInstance.post("/products", newProduct);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün başarıyla eklendi.");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Ürün eklenirken bir hata oluştu.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Product, "id"> }) => {
      const res = await axiosInstance.put(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün bilgileri başarıyla güncellendi.");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Ürün güncellenirken bir hata oluştu.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün sistemden tamamen silindi.");
      setProductToDelete(null);
    },
    onError: () => {
      toast.error("Ürün silinirken bir hata oluştu.");
      setProductToDelete(null);
    },
  });

  const handleOpenDialog = (product?: Product) => {
    setSelectedProduct(product || null);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: Omit<Product, "id">) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "imageUrl",
      header: "Görsel",
      cell: ({ row }) => (
        <img
          src={row.original.imageUrl}
          alt={row.original.title}
          className="w-10 h-10 rounded object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: "Başlık",
    },
    {
      accessorKey: "category",
      header: "Kategori",
    },
    {
      accessorKey: "price",
      header: "Fiyat",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stok",
      cell: ({ row }) => {
        const stock = parseInt(row.getValue("stock"));
        return (
          <Badge variant={stock > 0 ? "outline" : "destructive"}>
            {stock > 0 ? `${stock} adet mevcut` : "Stokta yok"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        if (role === "VIEWER") {
          return null;
        }
        
        return (
          <div className="flex items-center space-x-2 justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleOpenDialog(product)}
              title="Düzenle"
            >
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setProductToDelete(product)}
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
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Ürünler yükleniyor...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={products || []} 
          onRefresh={() => refetch()} 
          isRefreshing={isFetching} 
        />
      )}

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog 
        open={!!productToDelete} 
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              "{productToDelete?.title}" adlı ürün sistemden kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete.id);
                }
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