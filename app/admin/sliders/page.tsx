"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useSliders, useCreateSlider, useUpdateSlider, useDeleteSlider } from "@/hooks/useSliders";
import { Slider } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { SliderDialog } from "@/components/admin/slider-dialog";
import { getMinioUrl } from "@/lib/utils";
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

export default function SlidersPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Slider | null>(null);
  const [toDelete, setToDelete] = useState<Slider | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useSliders();
  const sliders: Slider[] = Array.isArray(data) ? data : (data as any)?.data || [];

  // Sıraya göre sıralayalım
  const sortedSliders = [...sliders].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const createMutation = useCreateSlider();
  const updateMutation = useUpdateSlider();
  const deleteMutation = useDeleteSlider();

  const handleSubmit = (formData: any) => {
    if (selected) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Slider güncellendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Slider güncellenirken hata oluştu."),
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Slider başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Slider eklenirken hata oluştu."),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Slider silindi.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Slider silinirken hata oluştu.");
        setToDelete(null);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Slider>[] = [
    {
      accessorKey: "imageUrl",
      header: "Görsel",
      cell: ({ row }) => {
        const url = row.original.imageUrl;
        const fullSrc = getMinioUrl(url);
        return (
          <div className="relative w-24 h-14 rounded-md overflow-hidden bg-muted border shrink-0">
            {fullSrc ? (
              <img
                src={fullSrc}
                alt={row.original.title || "Banner"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Başlık & Alt Başlık",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-sm">{row.original.title || "Başlıksız Banner"}</div>
          {row.original.subTitle && (
            <div className="text-xs text-muted-foreground truncate max-w-xs">{row.original.subTitle}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "targetUrl",
      header: "Hedef Link & Buton",
      cell: ({ row }) => {
        const target = row.original.targetUrl;
        return (
          <div className="space-y-1">
            {target ? (
              <a
                href={target}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {target}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Link tanımlanmamış</span>
            )}
            {row.original.buttonText && (
              <Badge variant="secondary" className="text-[10px]">
                {row.original.buttonText}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "displayOrder",
      header: "Sıra",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          #{row.original.displayOrder}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        if (role === "VIEWER") return null;
        const item = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelected(item);
                setDialogOpen(true);
              }}
              title="Düzenle"
            >
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setToDelete(item)}
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
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Slider & Banner Yönetimi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {role !== "VIEWER" && (
          <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Slider Ekle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Spinner size="lg" className="mb-4" />
          <p>Sliderlar yükleniyor...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sortedSliders}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}

      <SliderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sliderı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu banner ana sayfadan ve vitrinden kaldırılacaktır.
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
