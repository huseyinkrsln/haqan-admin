"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/api.types";
import { useRootCategoryLookup } from "@/hooks/useCategories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  categories?: Category[];
  isPending?: boolean;
  onSubmit: (data: any) => void;
}

import { getMinioUrl } from "@/lib/utils";

export function CategoryDialog({
  open,
  onOpenChange,
  initialData,
  categories,
  isPending,
  onSubmit,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  // Backend'den doğrudan "ParentCategoryId IS NULL" filtrelenmiş kök kategorileri çekiyoruz
  const { data: rootCategories, refetch: refetchRootCategories } = useRootCategoryLookup();

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      refetchRootCategories();
      setName(initialData?.name || "");
      setSlug(initialData?.slug || "");
      setParentCategoryId(initialData?.parentCategoryId ? String(initialData.parentCategoryId) : "");
      setDescription(initialData?.description || "");
      setImage1(null);
      setImage2(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initialData, refetchRootCategories]);

  // Eğer lookup verisi henüz gelmediyse veya önbellekteyse categories prop'undan ana kategorileri al
  const fallbackRoots = (categories || [])
    .filter((c) => !c.parentCategoryId || Number(c.parentCategoryId) === 0)
    .map((c) => ({ id: c.id, name: c.name }));

  const availableRoots = (rootCategories && rootCategories.length > 0) ? rootCategories : fallbackRoots;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      name: name.trim(),
      slug: slug.trim(),
    };

    if (parentCategoryId) payload.parentCategoryId = Number(parentCategoryId);
    if (description.trim()) payload.description = description.trim();
    if (image1) payload.Image1 = image1;
    if (image2) payload.Image2 = image2;

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Kategori bilgilerini ve resimlerini güncelleyin." : "Sisteme resimli yeni bir kategori ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Kategori Adı *</Label>
            <Input
              id="c-name"
              ref={firstInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Erkek Giyim"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-parent">Üst Kategori</Label>
            <select
              id="c-parent"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              disabled={isPending}
            >
              <option value="">Ana Kategori (Yok)</option>
              {availableRoots
                .filter((c) => !initialData?.id || c.id !== initialData.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Açıklama</Label>
            <Input
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kategori hakkında açıklama..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-img1">Birincil Görsel (Image 1)</Label>
            {initialData?.imageUrl1 && (
              <div className="mb-2">
                <img src={getMinioUrl(initialData.imageUrl1)} alt="Image 1" className="h-16 w-16 object-cover rounded border" />
              </div>
            )}
            <Input
              id="c-img1"
              type="file"
              accept="image/*"
              onChange={(e) => setImage1(e.target.files?.[0] || null)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground">Yeni bir dosya seçerseniz mevcut resim değiştirilecektir.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-img2">İkincil Görsel (Image 2)</Label>
            {initialData?.imageUrl2 && (
              <div className="mb-2">
                <img src={getMinioUrl(initialData.imageUrl2)} alt="Image 2" className="h-16 w-16 object-cover rounded border" />
              </div>
            )}
            <Input
              id="c-img2"
              type="file"
              accept="image/*"
              onChange={(e) => setImage2(e.target.files?.[0] || null)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground">Yeni bir dosya seçerseniz mevcut resim değiştirilecektir.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Spinner size="sm" className="mr-2" />{initialData ? "Güncelleniyor..." : "Kaydediliyor..."}</>
              ) : initialData ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
