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
import { useSizeGroups } from "@/hooks/useSizeGroups";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useFeatures } from "@/hooks/useFeatures";
import { useProductGroups } from "@/hooks/useProductGroups";
import { checkBarcodes } from "@/hooks/useProducts";
import {
  CreateComplexProductDto,
  ProductVariantCreateDto,
  ProductImageCreateDto,
  Color,
  Size,
  SizeGroup,
} from "@/types/api.types";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { getMinioUrl } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  ShieldCheck,
  Zap,
  CheckCheck,
} from "lucide-react";

function formatCategoryBreadcrumb(category: any, allCategories: any[] = []): string {
  if (!category) return "";
  const name = category.name || category.Name || "";
  const parentId = category.parentCategoryId ?? category.ParentCategoryId;

  if (!parentId || Number(parentId) === 0) {
    return name;
  }

  const parent = allCategories.find(
    (c: any) => Number(c.id ?? c.Id) === Number(parentId)
  );
  if (parent) {
    return `${formatCategoryBreadcrumb(parent, allCategories)} > ${name}`;
  }

  return name;
}

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

interface VariantRow {
  colorId: number;
  colorName: string;
  sizeId: number;
  sizeName: string;
  stockQuantity: number | string;
  priceDifference: number | string;
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
  const [productGroupId, setProductGroupId] = useState<number | "">("");
  const [brandId, setBrandId] = useState<number | "">("");
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
  const { data: sgData } = useSizeGroups();
  const { data: colorData } = useColors();
  const { data: bData } = useBrands();
  const { data: fData } = useFeatures();
  const { data: pgData, isLoading: isPgLoading } = useProductGroups(categoryId ? Number(categoryId) : undefined);

  const categoriesData = Array.isArray(cData) ? cData : (cData as any)?.data || [];
  const sizesData = Array.isArray(sData) ? sData : (sData as any)?.data || [];
  const sizeGroupsData = Array.isArray(sgData) ? sgData : (sgData as any)?.data || [];
  const colorsData = Array.isArray(colorData) ? colorData : (colorData as any)?.data || [];
  const brandsData = Array.isArray(bData) ? bData : (bData as any)?.data || [];
  const featuresData = Array.isArray(fData) ? fData : (fData as any)?.data || [];
  const productGroupsData = Array.isArray(pgData) ? pgData : (pgData as any)?.data || [];

  const [wizardSizeGroupId, setWizardSizeGroupId] = useState<number | null>(null);

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
            stockQuantity: "",
            priceDifference: "",
            sku: "",
            barcode: "",
          }
        );
      }
    }
    setVariantRows(rows);
  };

  const [barcodeErrors, setBarcodeErrors] = useState<Record<number, string>>({});
  const [isValidatingBarcodes, setIsValidatingBarcodes] = useState(false);
  const [bulkStock, setBulkStock] = useState<string | number>("");
  const [bulkPriceDiff, setBulkPriceDiff] = useState<string | number>("");

  const handleApplyBulkStock = () => {
    if (bulkStock === "" && bulkPriceDiff === "") {
      toast.info("Lütfen uygulanacak bir stok veya fiyat farkı değeri girin.");
      return;
    }
    setVariantRows((prev) =>
      prev.map((row) => ({
        ...row,
        stockQuantity: bulkStock !== "" ? bulkStock : row.stockQuantity,
        priceDifference: bulkPriceDiff !== "" ? bulkPriceDiff : row.priceDifference,
      }))
    );
    toast.success("Değerler tüm varyantlara uygulandı.");
  };

  const updateVariantRow = (idx: number, field: keyof VariantRow, value: any) => {
    setVariantRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

    if (field === "barcode" && barcodeErrors[idx]) {
      setBarcodeErrors((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
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

  const handleNext = async () => {
    if (step === 3) {
      buildVariantRows();
      setBarcodeErrors({});
      setStep(4);
      return;
    }

    if (step === 4) {
      // 1. Boş Barkod Kontrolü
      const errors: Record<number, string> = {};
      const trimmedBarcodes: { index: number; barcode: string }[] = [];

      variantRows.forEach((row, idx) => {
        const b = typeof row.barcode === "string" ? row.barcode.trim() : "";
        if (!b) {
          errors[idx] = "Barkod girilmesi zorunludur";
        } else {
          trimmedBarcodes.push({ index: idx, barcode: b });
        }
      });

      if (Object.keys(errors).length > 0) {
        setBarcodeErrors(errors);
        toast.error("Lütfen tüm varyantlar için barkod giriniz.");
        return;
      }

      // 2. Form İçi Duplicate Kontrolü
      const counts: Record<string, number[]> = {};
      trimmedBarcodes.forEach(({ index, barcode }) => {
        if (!counts[barcode]) counts[barcode] = [];
        counts[barcode].push(index);
      });

      let hasDuplicate = false;
      Object.entries(counts).forEach(([barcode, indices]) => {
        if (indices.length > 1) {
          hasDuplicate = true;
          indices.forEach((idx) => {
            errors[idx] = "Aynı barkodu birden fazla varyantta kullanamazsınız";
          });
        }
      });

      if (hasDuplicate) {
        setBarcodeErrors(errors);
        toast.error("Aynı barkod numarası birden fazla varyantta kullanılamaz.");
        return;
      }

      // 3. Backend Veritabanı Benzersizlik Kontrolü
      try {
        setIsValidatingBarcodes(true);
        const existingInDb = await checkBarcodes(trimmedBarcodes.map((t) => t.barcode));
        if (existingInDb && existingInDb.length > 0) {
          trimmedBarcodes.forEach(({ index, barcode }) => {
            if (existingInDb.includes(barcode)) {
              errors[index] = "Bu barkod sistemde zaten kayıtlı";
            }
          });
          setBarcodeErrors(errors);
          toast.error("Girdiğiniz bazı barkodlar sistemde zaten kayıtlı. Lütfen değiştirin.");
          return;
        }
      } catch (err: any) {
        toast.error("Barkod kontrolü yapılırken bir hata oluştu: " + (err.response?.data?.message || err.message));
        return;
      } finally {
        setIsValidatingBarcodes(false);
      }

      setBarcodeErrors({});
      buildImageRows();
      setStep(5);
      return;
    }

    setStep((s) => Math.min(5, s + 1));
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleReset = () => {
    setStep(1);
    setName(""); setDescription(""); setCategoryId(""); setProductGroupId(""); setBrandId(""); setDisplayOrder("");
    setBasePrice(""); setDiscountPrice("");
    setIsFeatured(false); setIsBestSeller(false); setIsNewArrival(false);
    setFeatureIds([]);
    setSelectedColorIds([]); setSizesByColor({});
    setWizardSizeGroupId(null);
    setVariantRows([]); setImageRows([]);
    setBarcodeErrors({});
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
        productGroupId: productGroupId ? Number(productGroupId) : undefined,
        brandId: brandId ? Number(brandId) : undefined,
        description: description.trim(),
        basePrice: Number(basePrice) || 0,
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        isFeatured,
        isBestSeller,
        isNewArrival,
        displayOrder: Number(displayOrder) || 0,
        featureIds: featureIds,
        variants: variantRows.map((r) => ({
          colorId: r.colorId,
          sizeId: r.sizeId,
          sku: r.sku?.trim() || undefined,
          barcode: r.barcode?.trim() || undefined,
          stockQuantity: Number(r.stockQuantity) || 0,
          priceDifference: Number(r.priceDifference) || 0,
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

  // const updateVariantRow = (idx: number, field: keyof VariantRow, value: any) => {
  //   setVariantRows((prev) => {
  //     const next = [...prev];
  //     next[idx] = { ...next[idx], [field]: value };
  //     return next;
  //   });
  // };

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
    if (step === 1) return Boolean(name.trim() && categoryId);
    if (step === 2) return Boolean(basePrice);
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori *</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value ? Number(e.target.value) : "");
                    setProductGroupId("");
                  }}
                >
                  <option value="">Kategori seçin</option>
                  {(categoriesData as any[])
                    .map((c: any) => ({
                      id: c.id ?? c.Id,
                      label: formatCategoryBreadcrumb(c, categoriesData),
                    }))
                    .sort((a: any, b: any) => a.label.localeCompare(b.label, "tr"))
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">
                  <span>Ürün Grubu (Opsiyonel)</span>
                  {isPgLoading && <span className="text-[10px] text-muted-foreground">Yükleniyor...</span>}
                </Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={productGroupId}
                  onChange={(e) => setProductGroupId(e.target.value ? Number(e.target.value) : "")}
                  disabled={!categoryId || isPgLoading}
                >
                  <option value="">
                    {!categoryId
                      ? "Önce kategori seçin"
                      : productGroupsData.length === 0
                      ? "Bu kategoride grup yok"
                      : "Ürün grubu seçin (isteğe bağlı)"}
                  </option>
                  {productGroupsData.map((pg: any) => {
                    const pgName = pg.name || pg.Name || `Grup #${pg.id || pg.Id}`;
                    return (
                      <option key={pg.id || pg.Id} value={pg.id || pg.Id}>
                        {pgName}
                      </option>
                    );
                  })}
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
            <div className="space-y-1.5">
              <Label htmlFor="p-order">Görüntülenme Sıralaması</Label>
              <Input id="p-order" type="number" min="0" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="0" className="h-9 w-28 text-center text-xs font-mono font-bold" />
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
                    <div className={`w-4 h-4 flex items-center justify-center border rounded-sm shrink-0 ${featureIds.includes(f.id) ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                      {featureIds.includes(f.id) && <Check className="w-3 h-3" />}
                    </div>
                    {f.icon && (
                      <img
                        src={getMinioUrl(f.icon)}
                        alt={f.name}
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    )}
                    <span className="truncate">{f.name}</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <Label className="text-sm font-medium">Her Renk İçin Bedenler *</Label>
                    <p className="text-xs text-muted-foreground">İlgili beden grubunu seçerek hızlıca filtreleyebilirsiniz</p>
                  </div>

                  {sizeGroupsData.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWizardSizeGroupId(null)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          wizardSizeGroupId === null
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        Tüm Gruplar
                      </button>
                      {sizeGroupsData.map((sg: SizeGroup) => (
                        <button
                          key={sg.id}
                          type="button"
                          onClick={() => setWizardSizeGroupId(sg.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            wizardSizeGroupId === sg.id
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                          }`}
                        >
                          {sg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedColorIds.map((colorId) => {
                  const color = (colorsData as Color[]).find((c) => c.id === colorId);
                  const availableSizes = wizardSizeGroupId
                    ? (sizesData as Size[]).filter((s) => s.sizeGroupId === wizardSizeGroupId)
                    : (sizesData as Size[]);

                  const groupSizeIds = availableSizes.map((s) => s.id);
                  const currentSelectedForColor = sizesByColor[colorId] || [];
                  const isAllGroupSelected =
                    availableSizes.length > 0 &&
                    groupSizeIds.every((id) => currentSelectedForColor.includes(id));
                  const hasAnySelected = currentSelectedForColor.length > 0;

                  const handleToggleGroup = () => {
                    setSizesByColor((prev) => {
                      const existing = prev[colorId] || [];
                      if (isAllGroupSelected) {
                        // Gruptaki bedenlerin seçimini kaldır
                        return {
                          ...prev,
                          [colorId]: existing.filter((id) => !groupSizeIds.includes(id)),
                        };
                      } else {
                        // Gruptaki tüm bedenleri seç
                        const merged = Array.from(new Set([...existing, ...groupSizeIds]));
                        return { ...prev, [colorId]: merged };
                      }
                    });
                  };

                  const handleClearAllForColor = () => {
                    setSizesByColor((prev) => ({
                      ...prev,
                      [colorId]: [],
                    }));
                  };

                  return (
                    <div key={colorId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color?.hexCode }} />
                          <span className="text-sm font-medium">{color?.name}</span>
                          {currentSelectedForColor.length > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              {currentSelectedForColor.length} Beden Seçildi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasAnySelected && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={handleClearAllForColor}
                              title="Bu renkteki tüm beden seçimlerini temizle"
                            >
                              Tümünü Temizle
                            </Button>
                          )}
                          {availableSizes.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-7 text-xs font-medium transition-colors ${
                                isAllGroupSelected
                                  ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  : "text-primary hover:text-primary hover:bg-primary/10"
                              }`}
                              onClick={handleToggleGroup}
                            >
                              {isAllGroupSelected
                                ? wizardSizeGroupId
                                  ? "Grubun Seçimini Kaldır"
                                  : "Seçimi Kaldır"
                                : wizardSizeGroupId
                                ? "Bu Grubu Seç"
                                : "Tümünü Seç"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => (
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
                        {availableSizes.length === 0 && (
                          <p className="text-xs text-muted-foreground">Bu grupta tanımlı beden bulunamadı.</p>
                        )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Her renk/beden kombinasyonu için stok ve kod bilgilerini girin.</p>
            </div>

            {/* Hızlı Toplu Değer Doldurma Çubuğu */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Hızlı Toplu Doldur:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">Stok:</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Tümü..."
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="h-7.5 w-24 text-center text-xs font-mono font-bold bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">Fiyat Farkı:</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bulkPriceDiff}
                    onChange={(e) => setBulkPriceDiff(e.target.value)}
                    className="h-7.5 w-24 text-center text-xs font-mono font-bold bg-white"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleApplyBulkStock}
                  className="h-7.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Tümüne Uygula
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium">Renk</th>
                    <th className="text-left py-2 pr-3 font-medium">Beden</th>
                    <th className="text-left py-2 pr-3 font-medium">Stok</th>
                    <th className="text-left py-2 pr-3 font-medium">Fiyat Farkı (₺)</th>
                    <th className="text-left py-2 pr-3 font-medium">SKU (Opsiyonel)</th>
                    <th className="text-left py-2 font-medium">Barkod <span className="text-destructive">*</span></th>
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
                          placeholder="0"
                          value={row.stockQuantity}
                          onChange={(e) => updateVariantRow(idx, "stockQuantity", e.target.value)}
                          className="h-8 w-20 text-center text-xs font-mono font-bold"
                          min={0}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={row.priceDifference}
                          onChange={(e) => updateVariantRow(idx, "priceDifference", e.target.value)}
                          className="h-8 w-24 text-center text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          value={row.sku}
                          onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                          className="h-7 w-28 text-xs font-mono"
                          placeholder="Otomatik"
                        />
                      </td>
                      <td className="py-2">
                        <div className="space-y-0.5">
                          <Input
                            value={row.barcode}
                            onChange={(e) => updateVariantRow(idx, "barcode", e.target.value)}
                            className={`h-7 w-32 text-xs font-mono transition-colors ${
                              barcodeErrors[idx] ? "border-destructive focus-visible:ring-destructive bg-rose-50/40 text-destructive" : ""
                            }`}
                            placeholder="Barkod No *"
                            required
                          />
                          {barcodeErrors[idx] && (
                            <p className="text-[10px] text-destructive font-medium leading-none mt-0.5">{barcodeErrors[idx]}</p>
                          )}
                        </div>
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
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || isValidatingBarcodes}
              className={`transition-all font-semibold ${
                step === 4 && Object.keys(barcodeErrors).length > 0
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  : ""
              }`}
            >
              {isValidatingBarcodes ? (
                <>
                  <Spinner className="mr-1.5" size="sm" /> Barkodlar Kontrol Ediliyor...
                </>
              ) : step === 4 ? (
                Object.keys(barcodeErrors).length > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Barkodları Düzeltin & Tekrar Dene
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Barkodları Doğrula & İleri
                  </>
                )
              ) : (
                <>
                  İleri <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
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
