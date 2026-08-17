"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useColors } from "@/hooks/useColors";
import { useSizes } from "@/hooks/useSizes";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useFeatures } from "@/hooks/useFeatures";
import {
  CreateComplexProductDto,
  ProductVariantCreateDto,
  ProductImageCreateDto,
  Color,
  Size,
} from "@/types/api.types";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Temel Bilgiler" },
  { id: 2, label: "Fiyat & Etiketler" },
  { id: 3, label: "Renkler & Bedenler" },
  { id: 4, label: "Stok & SKU" },
  { id: 5, label: "Görseller" },
];

interface ProductWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateComplexProductDto) => void;
  isPending?: boolean;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VariantRow {
  colorId: number;
  colorName: string;
  sizeId: number;
  sizeName: string;
  stockQuantity: number;
  priceDifference: number;
  sku: string;
  barcode: string;
}

interface ImageRow {
  colorId: number;
  colorName: string;
  imageUrl: string;
  file?: File | null;
  displayOrder: number;
  isMain: boolean;
  isProductMain: boolean;
}

export function ProductWizardDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ProductWizardDialogProps) {
  const [step, setStep] = useState(1);

  // Step 1: Temel Bilgiler
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brandId, setBrandId] = useState<number | "">("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Step 2: Fiyat & Etiketler & Özellikler
  const [basePrice, setBasePrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [featureIds, setFeatureIds] = useState<number[]>([]);

  // Step 4: Varyant satırları (otomatik oluşur)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  // Step 5: Görsel satırları
  const [imageRows, setImageRows] = useState<ImageRow[]>([]);

  const { data: cData } = useCategories();
  const { data: sData } = useSizes();
  const { data: colorData } = useColors();
  const { data: bData } = useBrands();
  const { data: fData } = useFeatures();

  const categoriesData = Array.isArray(cData) ? cData : (cData as any)?.data || [];
  const sizesData = Array.isArray(sData) ? sData : (sData as any)?.data || [];
  const colorsData = Array.isArray(colorData) ? colorData : (colorData as any)?.data || [];
  const brandsData = Array.isArray(bData) ? bData : (bData as any)?.data || [];
  const featuresData = Array.isArray(fData) ? fData : (fData as any)?.data || [];

  // slug otomatik oluştur
  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name]);

  // Step 3 -> Step 4: Varyant satırlarını oluştur
  const buildVariantRows = () => {
    const rows: VariantRow[] = [];
    for (const colorId of selectedColorIds) {
      const color = colorsData.find((c: Color) => c.id === colorId);
      const sizes = sizesByColor[colorId] || [];
      for (const sizeId of sizes) {
        const size = sizesData.find((s: Size) => s.id === sizeId);
        // Aynı kombinasyon varsa koru, yoksa yeni ekle
        const existing = variantRows.find(
          (r) => r.colorId === colorId && r.sizeId === sizeId
        );
        rows.push(
          existing || {
            colorId,
            colorName: color?.name || "",
            sizeId,
            sizeName: size?.name || "",
            stockQuantity: 0,
            priceDifference: 0,
            sku: "",
            barcode: "",
          }
        );
      }
    }
    setVariantRows(rows);
  };

  // Step 4 -> Step 5: Renk bazlı görsel satırlarını oluştur (eğer yoksa)
  const buildImageRows = () => {
    const existingColorIds = imageRows.map((r) => r.colorId);
    const newRows: ImageRow[] = [...imageRows];
    for (const colorId of selectedColorIds) {
      if (!existingColorIds.includes(colorId)) {
        const color = colorsData.find((c: Color) => c.id === colorId);
        newRows.push({
          colorId,
          colorName: color?.name || "",
          imageUrl: "",
          displayOrder: 1,
          isMain: true,
          isProductMain: false,
        });
      }
    }
    setImageRows(newRows);
  };

  const handleNext = () => {
    if (step === 3) buildVariantRows();
    if (step === 4) buildImageRows();
    setStep((s) => Math.min(5, s + 1));
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleReset = () => {
    setStep(1);
    setName(""); setDescription(""); setCategoryId(""); setBrandId(""); setSlug(""); setDisplayOrder(0);
    setBasePrice(""); setDiscountPrice("");
    setIsFeatured(false); setIsBestSeller(false); setIsNewArrival(false);
    setSelectedColorIds([]); setSizesByColor({});
    setVariantRows([]); setImageRows([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      toast.error("Kategori seçimi zorunludur.");
      return;
    }

    setIsUploadingImages(true);

    try {
      // Önce dosyaları Minio'ya yükle
      const processedImageRows = await Promise.all(
        imageRows.map(async (r) => {
          if (r.file) {
            const formData = new FormData();
            formData.append("file", r.file);
            const res = await axiosInstance.post("/api/Uploads/image", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return {
              ...r,
              imageUrl: res.data.url, // Backend'den dönen URL (/backendbucket/...)
            };
          }
          return r;
        })
      );

      const payload: CreateComplexProductDto = {
        name: name.trim(),
        categoryId: Number(categoryId),
        brandId: brandId ? Number(brandId) : undefined,
        description: description.trim(),
        basePrice: Number(basePrice) || 0,
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        isFeatured,
        isBestSeller,
        isNewArrival,
        displayOrder: Number(displayOrder) || 0,
        slug: slug.trim(),
        featureIds: featureIds,
        variants: variantRows.map((r) => ({
          colorId: r.colorId,
          sizeId: r.sizeId,
          sku: r.sku,
          barcode: r.barcode,
          stockQuantity: Number(r.stockQuantity),
          priceDifference: Number(r.priceDifference),
        })),
        images: processedImageRows.map((r) => ({
          colorId: r.colorId,
          imageUrl: r.imageUrl,
          displayOrder: Number(r.displayOrder) || 0,
          isMain: r.isMain,
          isProductMain: r.isProductMain,
        })),
      };

      onSubmit(payload);
    } catch (error: any) {
      toast.error("Görseller yüklenirken bir hata oluştu.", { description: error.message });
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Step 3: Seçilen renkler ve bedenler
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [sizesByColor, setSizesByColor] = useState<Record<number, number[]>>({});
  const [colorSearch, setColorSearch] = useState("");

  const toggleColor = (id: number) => {
    setSelectedColorIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleSize = (colorId: number, sizeId: number) => {
    setSizesByColor((prev) => {
      const current = prev[colorId] || [];
      return {
        ...prev,
        [colorId]: current.includes(sizeId)
          ? current.filter((s) => s !== sizeId)
          : [...current, sizeId],
      };
    });
  };

  const selectAllSizesForColor = (colorId: number) => {
    const allSizeIds = (sizesData as Size[]).map(s => s.id);
    setSizesByColor((prev) => ({
      ...prev,
      [colorId]: allSizeIds,
    }));
  };

  const updateVariantRow = (idx: number, field: keyof VariantRow, value: any) => {
    setVariantRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addImageRow = (colorId: number) => {
    const color = colorsData.find((c: Color) => c.id === colorId);
    setImageRows((prev) => [
      ...prev,
      {
        colorId,
        colorName: color?.name || "",
        imageUrl: "",
        displayOrder: prev.filter((r) => r.colorId === colorId).length + 1,
        isMain: false,
        isProductMain: false,
      },
    ]);
  };

  const removeImageRow = (idx: number) => {
    setImageRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateImageRow = (idx: number, field: keyof ImageRow, value: any) => {
    setImageRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      // isProductMain: sadece biri olabilir
      if (field === "isProductMain" && value === true) {
        next.forEach((r, i) => { if (i !== idx) next[i] = { ...next[i], isProductMain: false }; });
      }
      // isMain: aynı renk içinde sadece biri
      if (field === "isMain" && value === true) {
        const targetColorId = next[idx].colorId;
        next.forEach((r, i) => {
          if (i !== idx && r.colorId === targetColorId) next[i] = { ...next[i], isMain: false };
        });
      }
      return next;
    });
  };

  const canGoNext = () => {
    if (step === 1) return name.trim() && categoryId && slug.trim();
    if (step === 2) return basePrice;
    if (step === 3) return selectedColorIds.length > 0 && selectedColorIds.every((cId) => (sizesByColor[cId] || []).length > 0);
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) { if (!o) handleReset(); onOpenChange(o); } }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Ürün Ekle</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                step > s.id ? "bg-primary text-primary-foreground" :
                step === s.id ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className={`ml-1.5 text-xs hidden sm:block ${step === s.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Temel Bilgiler ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Ürün Adı *</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Premium Pamuk Tişört" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Açıklama</Label>
              <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ürün hakkında kısa açıklama..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori *</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                >
                  <option value="">Kategori seçin</option>
                  {(categoriesData as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Marka</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Marka seçin (isteğe bağlı)</option>
                  {(brandsData as any[]).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-slug">Slug (URL) *</Label>
                <Input id="p-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ornek-urun-adi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-order">Sıralama</Label>
                <Input id="p-order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Fiyat & Etiketler ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-base-price">Taban Fiyat (₺) *</Label>
                <Input id="p-base-price" type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="250.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-disc-price">İndirimli Fiyat (₺)</Label>
                <Input id="p-disc-price" type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="199.90" />
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-4">
              <p className="text-sm font-medium">Ürün Etiketleri</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Öne Çıkan</p>
                  <p className="text-xs text-muted-foreground">Ana sayfada vitrin alanında göster</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Çok Satan</p>
                  <p className="text-xs text-muted-foreground">Bestseller etiketiyle göster</p>
                </div>
                <Switch checked={isBestSeller} onCheckedChange={setIsBestSeller} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Yeni Gelen</p>
                  <p className="text-xs text-muted-foreground">New Arrival etiketiyle göster</p>
                </div>
                <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Özellikler</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {featuresData.map((f: any) => (
                  <label
                    key={f.id}
                    className={`flex items-center gap-2 border px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all ${
                      featureIds.includes(f.id)
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={featureIds.includes(f.id)}
                      onChange={(e) => {
                        if (e.target.checked) setFeatureIds((prev) => [...prev, f.id]);
                        else setFeatureIds((prev) => prev.filter((id) => id !== f.id));
                      }}
                    />
                    <div className={`w-4 h-4 flex items-center justify-center border rounded-sm ${featureIds.includes(f.id) ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                      {featureIds.includes(f.id) && <Check className="w-3 h-3" />}
                    </div>
                    {f.name}
                  </label>
                ))}
                {featuresData.length === 0 && <p className="text-xs text-muted-foreground">Sistemde tanımlı özellik bulunamadı.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Renkler & Bedenler ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Renkler *</Label>
              <p className="text-xs text-muted-foreground">Bu üründe hangi renkler mevcut?</p>
              
              <Input 
                placeholder="Renk ara..." 
                value={colorSearch} 
                onChange={(e) => setColorSearch(e.target.value)}
                className="h-8 text-sm max-w-sm mb-2"
              />

              <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-1 border border-transparent">
                {(colorsData as Color[])
                  .filter((color) => color.name.toLowerCase().includes(colorSearch.toLowerCase()))
                  .map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => toggleColor(color.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
                      selectedColorIds.includes(color.id)
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    {color.name}
                    {selectedColorIds.includes(color.id) && <Check className="w-3 h-3" />}
                  </button>
                ))}
                {(colorsData as Color[]).filter((color) => color.name.toLowerCase().includes(colorSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-muted-foreground">Eşleşen renk bulunamadı.</p>
                )}
              </div>
            </div>

            {selectedColorIds.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Her Renk İçin Bedenler *</Label>
                {selectedColorIds.map((colorId) => {
                  const color = (colorsData as Color[]).find((c) => c.id === colorId);
                  return (
                    <div key={colorId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color?.hexCode }} />
                          <span className="text-sm font-medium">{color?.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => selectAllSizesForColor(colorId)}
                        >
                          Tümünü Seç
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(sizesData as Size[]).map((size) => (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => toggleSize(colorId, size.id)}
                            className={`px-3 py-1 rounded border text-sm transition-all ${
                              (sizesByColor[colorId] || []).includes(size.id)
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {size.name}
                          </button>
                        ))}
                      </div>
                      {(sizesByColor[colorId] || []).length === 0 && (
                        <p className="text-xs text-destructive">En az bir beden seçmelisiniz</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Stok & SKU ── */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Her renk/beden kombinasyonu için stok ve kod bilgilerini girin.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium">Renk</th>
                    <th className="text-left py-2 pr-3 font-medium">Beden</th>
                    <th className="text-left py-2 pr-3 font-medium">Stok</th>
                    <th className="text-left py-2 pr-3 font-medium">Fiyat Farkı (₺)</th>
                    <th className="text-left py-2 pr-3 font-medium">SKU</th>
                    <th className="text-left py-2 font-medium">Barkod</th>
                  </tr>
                </thead>
                <tbody>
                  {variantRows.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: (colorsData as Color[]).find((c) => c.id === row.colorId)?.hexCode }} />
                          <span>{row.colorName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">{row.sizeName}</td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          value={row.stockQuantity}
                          onChange={(e) => updateVariantRow(idx, "stockQuantity", Number(e.target.value))}
                          className="h-7 w-20"
                          min={0}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.priceDifference}
                          onChange={(e) => updateVariantRow(idx, "priceDifference", Number(e.target.value))}
                          className="h-7 w-24"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          value={row.sku}
                          onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                          className="h-7 w-28"
                          placeholder="Otomatik"
                        />
                      </td>
                      <td className="py-2">
                        <Input
                          value={row.barcode}
                          onChange={(e) => updateVariantRow(idx, "barcode", e.target.value)}
                          className="h-7 w-28"
                          placeholder="Otomatik"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STEP 5: Görseller ── */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Her renk için ürün görsellerini yükleyin. <span className="font-medium">İlk eklenen görsel</span> otomatik olarak o rengin ana görseli olur. Yalnızca tek bir görseli, ürünün genel <span className="font-medium">Vitrin Görseli</span> olarak belirleyebilirsiniz.
            </p>
            {selectedColorIds.map((colorId) => {
              const color = (colorsData as Color[]).find((c) => c.id === colorId);
              const colorImages = imageRows
                .map((r, globalIdx) => ({ ...r, globalIdx }))
                .filter((r) => r.colorId === colorId);

              return (
                <div key={colorId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color?.hexCode }} />
                      <span className="font-medium text-sm">{color?.name}</span>
                      <Badge variant="outline" className="text-xs">{colorImages.length} görsel</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addImageRow(colorId)}>
                      <Plus className="w-3 h-3 mr-1" /> Görsel Ekle
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {colorImages.map(({ globalIdx, ...row }) => (
                      <div key={globalIdx} className="flex items-center gap-4 bg-muted/20 border rounded-md p-3 relative group">
                        {/* Preview Area */}
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden border shrink-0 relative">
                          {row.file ? (
                            <img src={URL.createObjectURL(row.file)} alt="preview" className="w-full h-full object-cover" />
                          ) : row.imageUrl ? (
                            <img src={row.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                          )}
                        </div>

                        {/* File Input & Controls */}
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => updateImageRow(globalIdx, "file", e.target.files?.[0] || null)}
                              className="h-8 text-xs cursor-pointer flex-1 pt-1.5"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeImageRow(globalIdx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.isMain}
                                onChange={(e) => updateImageRow(globalIdx, "isMain", e.target.checked)}
                                className="rounded border-gray-300 w-3.5 h-3.5"
                              />
                              Renk Ana Görseli
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.isProductMain}
                                onChange={(e) => updateImageRow(globalIdx, "isProductMain", e.target.checked)}
                                className="rounded border-gray-300 w-3.5 h-3.5 text-primary focus:ring-primary"
                              />
                              Vitrin Görseli
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    {colorImages.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Henüz görsel eklenmedi.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={step === 1 || isPending || isUploadingImages}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <span className="text-xs text-muted-foreground">{step} / {STEPS.length}</span>
          {step < 5 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              İleri <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isPending || isUploadingImages}
            >
              {isPending || isUploadingImages ? (
                <>
                  <Spinner className="mr-2" size="sm" /> 
                  {isUploadingImages ? "Görseller Yükleniyor..." : "Kaydediliyor..."}
                </>
              ) : (
                <><Check className="w-4 h-4 mr-1" />Ürünü Kaydet</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
