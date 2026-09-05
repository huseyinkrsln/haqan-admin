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
import { useSizeGroups } from "@/hooks/useSizeGroups";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  categories?: Category[];
  isPending?: boolean;
  onSubmit: (data: any) => void;
}

import {
  Layers,
  Shirt,
  Footprints,
  ShoppingBag,
  Sparkles,
  Flame,
  Tag,
  Crown,
  Watch,
  Glasses,
  Compass,
  Heart,
} from "lucide-react";
import { getMinioUrl } from "@/lib/utils";

const ROOT_CATEGORY_ICONS = [
  { id: "Layers", label: "Koleksiyon", icon: Layers },
  { id: "Shirt", label: "Giyim", icon: Shirt },
  { id: "Footprints", label: "Ayakkabı", icon: Footprints },
  { id: "ShoppingBag", label: "Çanta / Aks.", icon: ShoppingBag },
  { id: "Sparkles", label: "Yeni / Trend", icon: Sparkles },
  { id: "Flame", label: "Popüler", icon: Flame },
  { id: "Tag", label: "İndirim / Fırsat", icon: Tag },
  { id: "Crown", label: "Özel Tasarım", icon: Crown },
  { id: "Watch", label: "Saat", icon: Watch },
  { id: "Glasses", label: "Gözlük", icon: Glasses },
  { id: "Compass", label: "Stil / Keşfet", icon: Compass },
  { id: "Heart", label: "Favoriler", icon: Heart },
];

function slugify(val: string) {
  return val
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

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
  const [icon, setIcon] = useState<string>("Layers");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [sizeGroupId, setSizeGroupId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  // Backend'den doğrudan "ParentCategoryId IS NULL" filtrelenmiş kök kategorileri çekiyoruz
  const { data: rootCategories, refetch: refetchRootCategories } = useRootCategoryLookup();
  const { data: sizeGroups = [], refetch: refetchSizeGroups } = useSizeGroups();

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      refetchRootCategories();
      refetchSizeGroups();
      setName(initialData?.name || "");
      setSlug(initialData?.slug || "");
      setIcon(initialData?.icon || "Layers");
      setParentCategoryId(initialData?.parentCategoryId ? String(initialData.parentCategoryId) : "");
      setSizeGroupId(initialData?.sizeGroupId ? String(initialData.sizeGroupId) : "");
      setDescription(initialData?.description || "");
      setImage1(null);
      setImage2(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initialData, refetchRootCategories, refetchSizeGroups]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  // Eğer lookup verisi henüz gelmediyse veya önbellekteyse categories prop'undan ana kategorileri al
  const fallbackRoots = (categories || [])
    .filter((c) => !c.parentCategoryId || Number(c.parentCategoryId) === 0)
    .map((c) => ({ id: c.id, name: c.name }));

  const availableRoots = (rootCategories && rootCategories.length > 0) ? rootCategories : fallbackRoots;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isRoot = !parentCategoryId || Number(parentCategoryId) === 0;
    const payload: any = {
      name: name.trim(),
      slug: (slug.trim() || slugify(name)).trim(),
      icon: isRoot ? icon : null,
    };

    if (parentCategoryId) payload.parentCategoryId = Number(parentCategoryId);
    if (sizeGroupId) payload.sizeGroupId = Number(sizeGroupId);
    else payload.sizeGroupId = null;
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: Erkek Giyim"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">URL Bağlantısı (Slug):</span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                Sistem Tarafından Otomatik
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground break-all">
              /koleksiyon/<span className="text-foreground font-semibold">{slugify(name) || (initialData?.slug ? initialData.slug : "...")}</span>
            </p>
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

          {/* Sadece Ana Kategoriler İçin İkon Seçici */}
          {(!parentCategoryId || Number(parentCategoryId) === 0) && (
            <div className="space-y-2 p-3 rounded-lg border border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-950/20 transition-all">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  Ana Kategori İkonu
                </Label>
                <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                  Mobil Tab & Menü İkonu
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Bu kategori mobil alt barda yer aldığında görüntülenecek ikonu seçin:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {ROOT_CATEGORY_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = (icon || "Layers") === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      disabled={isPending}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-100/90 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100 font-bold shadow-sm ring-1 ring-emerald-500"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <IconComp size={18} className={isSelected ? "stroke-[2.3] text-emerald-700 dark:text-emerald-300" : "stroke-[1.8]"} />
                      <span className="text-[10px] mt-1 truncate max-w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="c-size-group">Beden Grubu (Size Group)</Label>
            <select
              id="c-size-group"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={sizeGroupId}
              onChange={(e) => setSizeGroupId(e.target.value)}
              disabled={isPending}
            >
              <option value="">Beden Grubu Yok / İsteğe Bağlı</option>
              {sizeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Bu kategoriye ait ürünlerin ve web filtrelerinin kullanacağı beden grubunu seçin (Örn: Giyim, Ayakkabı, Aksesuar).
            </p>
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

          {/* Resim alanları geçici olarak devre dışı bırakıldı
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
          */}

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
