"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { CategoryProductGroupsDialog } from "@/components/admin/category-product-groups-dialog";
import { getApiErrorMessage } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [categoryForProductGroups, setCategoryForProductGroups] = useState<Category | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useCategories();
  
  // Backend'den PaginatedResult veya IDataResult dönebilir, güvenli şekilde array'i alalım
  const categories: Category[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleSubmit = (data: any) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data }, {
        onSuccess: () => {
          toast.success("Kategori güncellendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getApiErrorMessage(err, "Kategori güncellenirken hata oluştu."))
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Kategori başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getApiErrorMessage(err, "Kategori eklenirken hata oluştu."))
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Kategori başarıyla silindi.");
        setToDelete(null);
      },
      onError: (err: any) => {
        const errorMsg = getApiErrorMessage(err, "Kategori silinirken hata oluştu.");
        toast.error(errorMsg, { duration: 6000 });
        setToDelete(null);
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // parentCategoryId eşleştirme: liste içinde ana kategori adını bul
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Silinmek istenen kategorinin alt kategorilerini tespit et
  const subCategoriesOfToDelete = toDelete
    ? categories.filter((c) => c.parentCategoryId === toDelete.id)
    : [];
  const hasSubCategories = subCategoriesOfToDelete.length > 0;

  const columns: ColumnDef<Category>[] = [
    { accessorKey: "name", header: "Kategori Adı" },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: "parentCategoryId",
      header: "Üst Kategori",
      cell: ({ row }) => {
        const pid = row.original.parentCategoryId;
        return pid ? (
          <Badge variant="outline">{categoryMap[pid] ?? `#${pid}`}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Ana kategori</span>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        if (role === "VIEWER") return null;
        const item = row.original;
        const isSubCategory = !!item.parentCategoryId;

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {isSubCategory && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500"
                onClick={() => setCategoryForProductGroups(item)}
                title="Bu alt kategoriye ait ürün gruplarını (alt grupları) yönet"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ürün Grupları</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDialogOpen(true); }} title="Düzenle">
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setToDelete(item)} title="Sil">
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
              <BreadcrumbPage>Kategoriler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kategori
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="Kategori ara..."
        loading={isLoading}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selected}
        categories={categories}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

      <CategoryProductGroupsDialog
        open={!!categoryForProductGroups}
        onOpenChange={(open) => { if (!open) setCategoryForProductGroups(null); }}
        category={categoryForProductGroups}
        parentCategoryName={categoryForProductGroups?.parentCategoryId ? categoryMap[categoryForProductGroups.parentCategoryId] : undefined}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!deleteMutation.isPending && !open) setToDelete(null); }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Kategoriyi Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{toDelete?.name}&quot;</strong> kategorisini silmek üzeresiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasSubCategories ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-2 my-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Bu kategoriye bağlı {subCategoriesOfToDelete.length} adet alt kategori bulunmaktadır:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 font-medium pl-1 text-foreground">
                {subCategoriesOfToDelete.map((sub) => (
                  <li key={sub.id}>{sub.name}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                Alt kategorisi olan ana kategoriler doğrudan silinemez. Silme işlemi yapabilmek için önce alt kategorileri silmeli veya başka bir üst kategoriye taşımalısınız.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground my-1">
              Bu işlem kategoriyi sistemden kaldıracaktır. Kategoriye bağlı ürünler bulunuyorsa silme işlemi engellenecektir.
            </p>
          )}

          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {hasSubCategories ? "Kapat" : "İptal"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) handleDelete(toDelete.id);
              }}
              disabled={deleteMutation.isPending || hasSubCategories}
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
