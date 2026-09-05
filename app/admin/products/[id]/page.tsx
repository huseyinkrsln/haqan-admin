"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft,
  Save,
  Tag,
  Package,
  Image as ImageIcon,
  AlertCircle,
  Percent,
  Plus,
  Star,
  Palette,
  Trash2,
  UploadCloud,
  Upload,
  X,
  Sparkles,
  BadgeCheck,
  TrendingUp,
  Clock,
  Layers,
  Check,
  Pencil,
  ShieldCheck,
  Zap,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

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
  useProductById,
  useUpdateProduct,
  useProductVariantsByProductId,
  useUpdateProductVariant,
  useAddProductVariant,
  useProductImagesByProductId,
  useProductColorsByProductId,
  useAddProductImage,
  useDeleteProductImage,
  useUpdateProductImage,
  useAddProductColor,
  checkBarcodes,
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useColors } from "@/hooks/useColors";
import { useSizes } from "@/hooks/useSizes";
import { useSizeGroups } from "@/hooks/useSizeGroups";
import { useProductGroups } from "@/hooks/useProductGroups";
import { useFeatures } from "@/hooks/useFeatures";
import { useOutfitsByProductId, useBulkUpdateOutfitPrices } from "@/hooks/useOutfits";
import { UpdateProductDto } from "@/types/api.types";

import { getMinioUrl } from "@/lib/utils";

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

const getImageUrl = (url?: string | null) => {
  if (!url) return "";
  return getMinioUrl(url);
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isViewer = role === "VIEWER";

  // Data Hooks
  const { data: product, isLoading: isProductLoading } = useProductById(id);
  const { data: variantsData, isLoading: isVariantsLoading } = useProductVariantsByProductId(id);
  const { data: productColorsData, isLoading: isProductColorsLoading } = useProductColorsByProductId(id);
  const { data: imagesData, isLoading: isImagesLoading } = useProductImagesByProductId(id);

  const variants = Array.isArray(variantsData) ? variantsData : (variantsData as any)?.data || [];
  const productColors = Array.isArray(productColorsData) ? productColorsData : (productColorsData as any)?.data || [];
  const images = Array.isArray(imagesData) ? imagesData : (imagesData as any)?.data || [];
  
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
  const { data: brandsData, isLoading: isBrandsLoading } = useBrands();
  const { data: globalColorsData } = useColors();
  const { data: globalSizesData } = useSizes();
  const { data: sizeGroupsData } = useSizeGroups();
  const { data: allFeaturesData } = useFeatures();

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || [];
  const brands = Array.isArray(brandsData) ? brandsData : (brandsData as any)?.data || [];
  const globalColors = Array.isArray(globalColorsData) ? globalColorsData : (globalColorsData as any)?.data || [];
  const globalSizes = Array.isArray(globalSizesData) ? globalSizesData : (globalSizesData as any)?.data || [];
  const sizeGroups = Array.isArray(sizeGroupsData) ? sizeGroupsData : (sizeGroupsData as any)?.data || [];
  const allFeatures = Array.isArray(allFeaturesData) ? allFeaturesData : (allFeaturesData as any)?.data || [];

  const updateProductMutation = useUpdateProduct();
  const updateProductVariantMutation = useUpdateProductVariant();
  const addProductVariantMutation = useAddProductVariant();
  const addProductImageMutation = useAddProductImage();
  const updateProductImageMutation = useUpdateProductImage();
  const deleteProductImageMutation = useDeleteProductImage();
  const addProductColorMutation = useAddProductColor();

  // State
  const [formData, setFormData] = useState<UpdateProductDto | null>(null);

  const { data: productGroupsData, isLoading: isProductGroupsLoading } = useProductGroups(
    formData?.categoryId ? Number(formData.categoryId) : undefined
  );
  const productGroups = Array.isArray(productGroupsData) ? productGroupsData : (productGroupsData as any)?.data || [];

  // Varyantları inline düzenleme için state
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantUpdates, setVariantUpdates] = useState<Record<number, { stockQuantity?: number | string; priceDifference?: number | string }>>({});

  // Image Upload & Management State
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [activeImageColorId, setActiveImageColorId] = useState<number | null>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [newImage, setNewImage] = useState<{
    file: File | null;
    globalColorId: number | string;
    isMain: boolean;
    isProductMain: boolean;
  }>({
    file: null,
    globalColorId: "",
    isMain: false,
    isProductMain: false,
  });

  // Batch Variant Add State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [batchColorId, setBatchColorId] = useState<string | number>("");
  const [batchSizeGroupId, setBatchSizeGroupId] = useState<number | null>(null);
  const [batchBarcodeErrors, setBatchBarcodeErrors] = useState<Record<number, string>>({});
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchBulkStock, setBatchBulkStock] = useState<string | number>("");
  const [batchBulkPriceDiff, setBatchBulkPriceDiff] = useState<string | number>("");
  const [batchRows, setBatchRows] = useState<{
    sizeId: number;
    sizeName: string;
    stockQuantity: string | number;
    priceDifference: string | number;
    sku: string;
    barcode: string;
  }[]>([]);

  const handleApplyBatchBulkStock = () => {
    if (batchBulkStock === "" && batchBulkPriceDiff === "") {
      toast.info("Lütfen uygulanacak bir stok veya fiyat farkı değeri girin.");
      return;
    }
    setBatchRows((prev) =>
      prev.map((row) => ({
        ...row,
        stockQuantity: batchBulkStock !== "" ? batchBulkStock : row.stockQuantity,
        priceDifference: batchBulkPriceDiff !== "" ? batchBulkPriceDiff : row.priceDifference,
      }))
    );
    toast.success("Değerler tüm seçili varyantlara uygulandı.");
  };

  const [activeTab, setActiveTab] = useState<"general" | "variants" | "outfits" | "features">("general");

  const handleTabChange = (tab: "general" | "variants" | "outfits" | "features") => {
    setActiveTab(tab);
    if (tab === "outfits") {
      setShouldFetchOutfits(true);
      refetchProductOutfits();
    }
  };

  const [isOutfitsModalOpen, setIsOutfitsModalOpen] = useState(false);
  const [isPriceChangeTriggered, setIsPriceChangeTriggered] = useState(false);
  const [shouldFetchOutfits, setShouldFetchOutfits] = useState(false);

  // Kombin verisi sayfa ilk açıldığında otomatik gelmez, sadece butona tıklandığında veya fiyat değiştiğinde çekilir
  const {
    data: productOutfits,
    isLoading: isProductOutfitsLoading,
    refetch: refetchProductOutfits,
  } = useOutfitsByProductId(id, activeTab === "outfits" || shouldFetchOutfits);

  const bulkUpdateOutfitPricesMutation = useBulkUpdateOutfitPrices();
  const [outfitPrices, setOutfitPrices] = useState<Record<number, number>>({});
  const [isUpdatingOutfitPrices, setIsUpdatingOutfitPrices] = useState(false);

  useEffect(() => {
    if (productOutfits && productOutfits.length > 0) {
      setOutfitPrices((prev) => {
        const next = { ...prev };
        productOutfits.forEach((o) => {
          if (next[o.outfitId] === undefined) {
            next[o.outfitId] = o.currentOutfitPrice;
          }
        });
        return next;
      });
    }
  }, [productOutfits]);

  const handleOpenOutfitsModal = async () => {
    setIsPriceChangeTriggered(false);
    setShouldFetchOutfits(true);
    setIsOutfitsModalOpen(true);
    refetchProductOutfits();
  };

  const handleSaveOutfitPrices = async () => {
    if (!productOutfits || productOutfits.length === 0) return;
    setIsUpdatingOutfitPrices(true);
    const updates = productOutfits.map((o) => ({
      outfitId: o.outfitId,
      newPrice: Number(outfitPrices[o.outfitId] ?? o.currentOutfitPrice),
    }));
    try {
      await bulkUpdateOutfitPricesMutation.mutateAsync(updates);
      toast.success("Kombin fiyatları başarıyla güncellendi.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Kombin fiyatları güncellenirken hata oluştu.");
    } finally {
      setIsUpdatingOutfitPrices(false);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        productGroupId: product.productGroupId,
        brandId: product.brandId,
        description: product.description || "",
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        displayOrder: product.displayOrder,
        slug: product.slug,
        featureIds: (product as any).featureIds || (product as any).features?.map((f: any) => f.id) || [],
      });
    }
  }, [product]);

  const handleBaseSave = () => {
    if (!formData) return;

    if (!formData.categoryId) {
      toast.error("Kategori seçimi zorunludur.");
      return;
    }

    // Fiyat değişikliği var mı kontrol et
    const isPriceChanged =
      product &&
      (Number(formData.basePrice) !== Number(product.basePrice) ||
        Number(formData.discountPrice ?? 0) !== Number(product.discountPrice ?? 0));

    updateProductMutation.mutate(formData, {
      onSuccess: async () => {
        toast.success("Ürün bilgileri başarıyla güncellendi.");
        
        // Eğer fiyat değiştiyse, dahil olduğu kombinleri kontrol et ve varsa geniş modalda göster
        if (isPriceChanged) {
          setShouldFetchOutfits(true);
          const outfitsRes = await refetchProductOutfits();
          const list = outfitsRes.data || [];
          if (list.length > 0) {
            setIsPriceChangeTriggered(true);
            setIsOutfitsModalOpen(true);
          }
        }
      },
      onError: (err: any) => {
        const msg =
          err.response?.data?.Message ||
          err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response?.data : null) ||
          "Ürün güncellenirken bir hata oluştu.";
        toast.error(msg);
      },
    });
  };

  const handleVariantSave = (variantId: number, originalData: any) => {
    const current = variantUpdates[variantId];
    if (!current) return;
    
    updateProductVariantMutation.mutate({ 
      id: variantId, 
      ...originalData,
      stockQuantity: current.stockQuantity !== undefined && current.stockQuantity !== "" ? Number(current.stockQuantity) : originalData.stockQuantity,
      priceDifference: current.priceDifference !== undefined && current.priceDifference !== "" ? Number(current.priceDifference) : originalData.priceDifference
    }, {
      onSuccess: () => {
        toast.success("Varyant güncellendi");
        setVariantUpdates((prev) => {
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
        setEditingVariantId(null);
      },
      onError: (err: any) => {
        toast.error("Varyant güncellenemedi", { description: err.response?.data || err.message });
      }
    });
  };

  // Mevcut ürün rengindeki varyant size ID'leri (çift eklemeyi önlemek için)
  const existingVariantSizeIds = useMemo(() => {
    if (!batchColorId) return [];
    const pc = productColors.find((p: any) => p.colorId === Number(batchColorId));
    if (!pc) return [];
    return variants
      .filter((v: any) => (v.productColorId === pc.id || v.ProductColorId === pc.id) && !v.isDeleted)
      .map((v: any) => v.sizeId ?? v.SizeId);
  }, [batchColorId, productColors, variants]);

  const filteredSizes = useMemo(() => {
    if (!batchSizeGroupId) return globalSizes;
    return globalSizes.filter((s: any) => s.sizeGroupId === batchSizeGroupId);
  }, [globalSizes, batchSizeGroupId]);

  const handleToggleBatchSize = (size: any) => {
    setBatchRows((prev) => {
      const exists = prev.some((r) => r.sizeId === size.id);
      if (exists) {
        return prev.filter((r) => r.sizeId !== size.id);
      } else {
        return [
          ...prev,
          {
            sizeId: size.id,
            sizeName: size.name,
            stockQuantity: "",
            priceDifference: "",
            sku: "",
            barcode: "",
          },
        ];
      }
    });
  };

  const handleSelectAllGroupSizes = () => {
    const availableToAdd = filteredSizes.filter((s: any) => !existingVariantSizeIds.includes(s.id));
    setBatchRows((prev) => {
      const currentIds = prev.map((r) => r.sizeId);
      const newToAdd = availableToAdd
        .filter((s: any) => !currentIds.includes(s.id))
        .map((s: any) => ({
          sizeId: s.id,
          sizeName: s.name,
          stockQuantity: "",
          priceDifference: "",
          sku: "",
          barcode: "",
        }));
      return [...prev, ...newToAdd];
    });
  };

  const updateBatchRow = (idx: number, field: string, val: any) => {
    setBatchRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });

    if (field === "barcode" && batchBarcodeErrors[idx]) {
      setBatchBarcodeErrors((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const handleRemoveBatchRow = (sizeId: number) => {
    setBatchRows((prev) => prev.filter((r) => r.sizeId !== sizeId));
  };

  const handleAddBatchVariants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchColorId) {
      toast.error("Lütfen bir renk seçin");
      return;
    }
    if (batchRows.length === 0) {
      toast.error("Lütfen en az bir beden seçin");
      return;
    }

    // 1. Boş Barkod Kontrolü
    const errors: Record<number, string> = {};
    const trimmedBarcodes: { index: number; barcode: string }[] = [];

    batchRows.forEach((row, idx) => {
      const b = typeof row.barcode === "string" ? row.barcode.trim() : "";
      if (!b) {
        errors[idx] = "Barkod girilmesi zorunludur";
      } else {
        trimmedBarcodes.push({ index: idx, barcode: b });
      }
    });

    if (Object.keys(errors).length > 0) {
      setBatchBarcodeErrors(errors);
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
      setBatchBarcodeErrors(errors);
      toast.error("Aynı barkod numarası birden fazla varyantta kullanılamaz.");
      return;
    }

    // 3. Backend Veritabanı Kontrolü
    try {
      setIsSubmittingBatch(true);
      const existingInDb = await checkBarcodes(trimmedBarcodes.map((t) => t.barcode));
      if (existingInDb && existingInDb.length > 0) {
        trimmedBarcodes.forEach(({ index, barcode }) => {
          if (existingInDb.includes(barcode)) {
            errors[index] = "Bu barkod sistemde zaten kayıtlı";
          }
        });
        setBatchBarcodeErrors(errors);
        toast.error("Girdiğiniz bazı barkodlar sistemde zaten kayıtlı. Lütfen değiştirin.");
        setIsSubmittingBatch(false);
        return;
      }
    } catch (err: any) {
      toast.error("Barkod kontrolü yapılırken bir hata oluştu: " + (err.response?.data?.message || err.message));
      setIsSubmittingBatch(false);
      return;
    }

    const selectedGlobalColorId = Number(batchColorId);
    let targetProductColorId: number;
    const existingProductColor = productColors.find((pc: any) => pc.colorId === selectedGlobalColorId);

    try {
      if (existingProductColor) {
        targetProductColorId = existingProductColor.id;
      } else {
        const pcResult: any = await addProductColorMutation.mutateAsync({ 
          productId: id, 
          colorId: selectedGlobalColorId 
        });
        targetProductColorId = pcResult.data?.id || pcResult.id;
      }

      const promises = batchRows.map((row) =>
        addProductVariantMutation.mutateAsync({
          productColorId: targetProductColorId,
          sizeId: row.sizeId,
          stockQuantity: Number(row.stockQuantity) || 0,
          priceDifference: Number(row.priceDifference) || 0,
          sku: row.sku?.trim() || undefined,
          barcode: row.barcode.trim(),
        })
      );

      const count = batchRows.length;
      toast.promise(Promise.all(promises), {
        loading: `${count} varyant ekleniyor...`,
        success: () => {
          setIsVariantDialogOpen(false);
          setBatchColorId("");
          setBatchRows([]);
          setBatchBarcodeErrors({});
          setIsSubmittingBatch(false);
          return `${count} varyant başarıyla eklendi`;
        },
        error: (err: any) => {
          setIsSubmittingBatch(false);
          return err.response?.data?.message || err.message || "Varyantlar eklenirken hata oluştu";
        }
      });
    } catch (err: any) {
      setIsSubmittingBatch(false);
      toast.error(err.response?.data?.message || err.message || "İşlem sırasında hata oluştu");
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage.file) {
      toast.error("Lütfen bir görsel seçin");
      return;
    }
    if (!newImage.globalColorId) {
      toast.error("Lütfen bir renk seçin");
      return;
    }

    const selectedGlobalColorId = Number(newImage.globalColorId);
    let targetProductColorId: number;

    const existingProductColor = productColors.find((pc: any) => pc.colorId === selectedGlobalColorId);

    try {
      if (existingProductColor) {
        targetProductColorId = existingProductColor.id;
      } else {
        const pcResult: any = await addProductColorMutation.mutateAsync({ 
          productId: id, 
          colorId: selectedGlobalColorId 
        });
        targetProductColorId = pcResult.data?.id || pcResult.id;
      }

      const formData = new FormData();
      formData.append("productColorId", String(targetProductColorId));
      formData.append("isMain", String(newImage.isMain));
      formData.append("isProductMain", String(newImage.isProductMain));
      if (newImage.file) {
        formData.append("file", newImage.file);
      }
      formData.append("displayOrder", "0");

      const promise = addProductImageMutation.mutateAsync(formData);

      toast.promise(promise, {
        loading: "Görsel yükleniyor...",
        success: () => {
          setNewImage({ file: null, globalColorId: activeImageColorId ? String(productColors.find((pc: any) => pc.id === activeImageColorId)?.colorId || "") : "", isMain: false, isProductMain: false });
          return "Görsel başarıyla eklendi";
        },
        error: (err: any) => `İşlem başarısız: ${err.response?.data || err.message}`
      });
    } catch (err: any) {
      toast.error("Renk veya Görsel kaydedilirken hata oluştu", { description: err.message });
    }
  };

  const handleToggleImageFlags = (img: any, field: "isMain" | "isProductMain", value: boolean) => {
    const payload = {
      id: Number(img.id),
      productColorId: Number(img.productColorId),
      isMain: field === "isMain" ? value : Boolean(img.isMain),
      isProductMain: field === "isProductMain" ? value : Boolean(img.isProductMain),
      displayOrder: Number(img.displayOrder || 0),
      imageUrl: img.imageUrl,
    };

    const promise = updateProductImageMutation.mutateAsync(payload);
    toast.promise(promise, {
      loading: "Görsel güncelleniyor...",
      success: "Görsel başarıyla güncellendi",
      error: (err: any) => `Hata: ${err.response?.data?.message || err.response?.data || err.message}`
    });
  };

  const handleDeleteImageConfirm = () => {
    if (imageToDelete) {
      const promise = new Promise((resolve, reject) => {
        deleteProductImageMutation.mutate(imageToDelete, {
          onSuccess: (data) => resolve(data),
          onError: (err) => reject(err)
        });
      });

      toast.promise(promise, {
        loading: "Görsel siliniyor...",
        success: "Görsel başarıyla silindi",
        error: "Görsel silinemedi"
      });
      setImageToDelete(null);
    }
  };

  if (isProductLoading || isCategoriesLoading || isBrandsLoading || isVariantsLoading || isProductColorsLoading || isImagesLoading || !formData) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Spinner size="xl" />
        <p className="mt-4 text-muted-foreground">Ürün detayları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-24">
      {/* Sticky Header & Breadcrumb Bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin/products" />}>Ürünler</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[180px] font-medium">{product?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate max-w-[320px] sm:max-w-md">
              {formData.name || "İsimsiz Ürün"}
            </h1>
            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-slate-50">
              #{id}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/products")} className="h-9 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Listeye Dön
          </Button>
          {!isViewer && (
            <Button onClick={handleBaseSave} disabled={updateProductMutation.isPending} size="sm" className="h-9 font-medium shadow-xs">
              {updateProductMutation.isPending ? <Spinner size="sm" className="mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Değişiklikleri Kaydet
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange("general")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "general"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200/80"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Genel Bilgiler & Fiyat</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("features")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "features"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200/80"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Özellikler & Vitrin</span>
          {(formData.featureIds?.length ?? 0) > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                activeTab === "features"
                  ? "bg-white/20 text-white border-transparent"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {formData.featureIds?.length}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("variants")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "variants"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200/80"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Renkler & Varyantlar</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              activeTab === "variants"
                ? "bg-white/20 text-white border-transparent"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {variants.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("outfits")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "outfits"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-900 hover:text-amber-950 hover:bg-amber-100/70 bg-amber-50/70 border border-amber-200/80"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Dahil Olduğu Kombinler</span>
          {productOutfits && productOutfits.length > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                activeTab === "outfits"
                  ? "bg-white/20 text-white border-transparent"
                  : "bg-amber-200/80 text-amber-900 border-amber-300"
              }`}
            >
              {productOutfits.length}
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: GENEL BİLGİLER & FİYAT */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kolon (Temel Bilgiler) */}
          <div className="space-y-6">
            {/* Temel Bilgiler Kartı */}
          <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Temel Bilgiler</h2>
                <p className="text-xs text-muted-foreground">Ürünün ana başlık ve kategori tanımlamaları</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Ürün Adı *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  disabled={isViewer} 
                  placeholder="Örn: Yazlık Gömlek"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Kategori *</Label>
                <Select
                  disabled={isViewer}
                  value={formData.categoryId ? String(formData.categoryId) : ""}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      categoryId: Number(val),
                      productGroupId: undefined,
                    })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Kategori Seçin">
                      {formData.categoryId
                        ? formatCategoryBreadcrumb(
                            categories?.find((c: any) => String(c.id ?? c.Id) === String(formData.categoryId)),
                            categories
                          )
                        : "Kategori Seçin *"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      ?.map((c: any) => ({
                        id: c.id ?? c.Id,
                        label: formatCategoryBreadcrumb(c, categories),
                      }))
                      .sort((a: any, b: any) => a.label.localeCompare(b.label, "tr"))
                      .map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Ürün Grubu (Opsiyonel)</span>
                  {isProductGroupsLoading && <span className="text-[10px] text-muted-foreground">Yükleniyor...</span>}
                </Label>
                <Select
                  disabled={isViewer || !formData.categoryId || isProductGroupsLoading}
                  value={formData.productGroupId ? String(formData.productGroupId) : "none"}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      productGroupId: val === "none" ? undefined : Number(val),
                    })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={
                        !formData.categoryId
                          ? "Önce Kategori Seçin"
                          : productGroups.length === 0
                          ? "Bu kategoride grup yok"
                          : "Ürün Grubu Seçin (Opsiyonel)"
                      }
                    >
                      {formData.productGroupId
                        ? productGroups?.find((pg: any) => String(pg.id ?? pg.Id) === String(formData.productGroupId))?.name ||
                          productGroups?.find((pg: any) => String(pg.id ?? pg.Id) === String(formData.productGroupId))?.Name ||
                          `Grup #${formData.productGroupId}`
                        : "Grupsuz (Yok)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Grupsuz (Yok)</SelectItem>
                    {productGroups.map((pg: any) => {
                      const pgId = String(pg.id ?? pg.Id);
                      const pgName = pg.name || pg.Name || `Grup #${pgId}`;
                      return (
                        <SelectItem key={pgId} value={pgId}>
                          {pgName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Marka</Label>
                <Select
                  disabled={isViewer}
                  value={formData.brandId ? String(formData.brandId) : "none"}
                  onValueChange={(val) => setFormData({ ...formData, brandId: val === "none" ? undefined : Number(val) })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Marka Seçin (Opsiyonel)">
                      {formData.brandId ? brands?.find((b: any) => String(b.id) === String(formData.brandId))?.name : "Marka Seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Markasız</SelectItem>
                    {brands?.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

              <div className="col-span-full space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Ürün Açıklaması</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  disabled={isViewer}
                  rows={4} 
                  className="text-sm resize-y"
                  placeholder="Ürün hakkında detaylı bilgi, kumaş türü, kalıp özellikleri..."
                />
              </div>
            </div>
          </div>
          </div>

          {/* Sağ Kolon (Fiyat & İndirim) */}
          <div className="space-y-6">
            {/* Fiyat & İndirim Kartı */}
            <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Fiyat & İndirim</h2>
                  <p className="text-xs text-muted-foreground">Satış fiyatı ve kampanya tarihleri</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Taban Satış Fiyatı (TL)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={formData.basePrice} 
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })} 
                    disabled={isViewer} 
                    className="font-bold text-lg h-11 pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TL</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">İndirimli Fiyat (Opsiyonel)</Label>
                  {formData.discountPrice && formData.basePrice > formData.discountPrice && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      %{Math.round(((formData.basePrice - formData.discountPrice) / formData.basePrice) * 100)} İndirim
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    type="number"
                    value={formData.discountPrice || ""} 
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined })} 
                    disabled={isViewer} 
                    placeholder="İndirimsiz bırakmak için boş geçin"
                    className="h-10 text-sm pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TL</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Başlangıç
                  </Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.discountStartDate ? formData.discountStartDate.slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value || undefined })}
                    disabled={isViewer}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Bitiş
                  </Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.discountEndDate ? formData.discountEndDate.slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value || undefined })}
                    disabled={isViewer}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB ÖZELLİKLER & VİTRİN */}
      {activeTab === "features" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ürün Özellikleri */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Ürün Özellikleri</h2>
                  <p className="text-[10px] text-muted-foreground">Kumaş, yıkama ve teknik detaylar</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {formData.featureIds?.length || 0} seçildi
              </Badge>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {allFeatures.map((f: any) => {
                const isSelected = formData.featureIds?.includes(f.id) || false;
                return (
                  <label
                    key={f.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-medium shadow-2xs"
                        : "border-slate-200/70 hover:bg-slate-50/70 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 flex items-center justify-center border rounded-sm shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      {f.icon && (
                        <div className="w-5 h-5 bg-white border border-slate-200/60 rounded p-0.5 flex items-center justify-center shrink-0">
                          <img
                            src={getImageUrl(f.icon)}
                            alt={f.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="text-xs truncate">{f.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      disabled={isViewer}
                      onChange={(e) => {
                        const current = formData.featureIds || [];
                        const next = e.target.checked
                          ? [...current, f.id]
                          : current.filter((id: number) => id !== f.id);
                        setFormData({ ...formData, featureIds: next });
                      }}
                    />
                  </label>
                );
              })}

              {allFeatures.length === 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  Tanımlı özellik bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* Vitrin & Görünürlük */}
          <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Vitrin & Görünürlük</h2>
                <p className="text-xs text-muted-foreground">Mağazadaki öne çıkarma ayarları</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> Öne Çıkan Ürün
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Anasayfa vitrininde görünür.</p>
                </div>
                <Switch 
                  checked={Boolean(formData.isFeatured)}
                  onCheckedChange={(c) => setFormData({ ...formData, isFeatured: c })}
                  disabled={isViewer}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Çok Satanlar
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Trendler listesinde görünür.</p>
                </div>
                <Switch 
                  checked={Boolean(formData.isBestSeller)}
                  onCheckedChange={(c) => setFormData({ ...formData, isBestSeller: c })}
                  disabled={isViewer}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Yeni Gelenler
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Yeni sezon listesinde görünür.</p>
                </div>
                <Switch 
                  checked={Boolean(formData.isNewArrival)}
                  onCheckedChange={(c) => setFormData({ ...formData, isNewArrival: c })}
                  disabled={isViewer}
                />
              </div>

              <div className="pt-2">
                <Label className="text-xs font-semibold text-slate-700">Sıralama Önceliği (Display Order)</Label>
                <Input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.displayOrder === 0 ? "" : (formData.displayOrder ?? "")} 
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value === "" ? 0 : Number(e.target.value) })} 
                  disabled={isViewer} 
                  className="h-9 w-28 text-center text-xs font-mono font-bold mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Düşük sayılar listelerde daha önce görünür.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* TAB 2: RENKLER & VARYANTLAR */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          {/* Renkler, Görseller ve Varyantlar */}
          <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Renkler, Görseller ve Varyantlar</h2>
                  <p className="text-xs text-muted-foreground">Her renk için beden stokları ve fotoğraf galerisi</p>
                </div>
              </div>
              
              {!isViewer && (
                <div className="flex items-center gap-2">
                  <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
                    <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 text-white px-3.5 text-xs font-semibold shadow-xs hover:bg-slate-800 transition-colors">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Varyant Ekle
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          Toplu Varyant Ekle
                        </DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleAddBatchVariants} className="space-y-4 pt-2">
                        {/* 1. Renk Seçimi */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-0.5">
                            1. Renk Seçin <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={String(batchColorId || "")}
                            onValueChange={(val) => {
                              setBatchColorId(val);
                              setBatchRows([]);
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Renk Seçin">
                                {(() => {
                                  const sc = globalColors?.find((c: any) => String(c.id) === String(batchColorId));
                                  return sc ? (
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className="w-3.5 h-3.5 rounded-full border shadow-2xs" style={{ backgroundColor: sc.hexCode }} />
                                      <span className="font-semibold">{sc.name}</span>
                                      {productColors.some((pc: any) => pc.colorId === sc.id) && (
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Mevcut Renk</Badge>
                                      )}
                                    </div>
                                  ) : "Renk Seçin";
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {globalColors?.map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3.5 h-3.5 rounded-full border shadow-2xs" style={{ backgroundColor: c.hexCode }} />
                                    <span>{c.name}</span>
                                    {productColors.some((pc: any) => pc.colorId === c.id) && (
                                      <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-700 bg-emerald-50 border-emerald-200">Mevcut</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 2. Beden Grubu & Beden Seçimi */}
                        <div className="border rounded-xl bg-slate-50/50 divide-y divide-slate-200/80 overflow-hidden">
                          {/* 1. Beden Grubu Filtresi */}
                          {sizeGroups.length > 0 && (
                            <div className="p-3 bg-white/70 space-y-1.5">
                              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Beden Grubu Filtresi
                              </Label>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setBatchSizeGroupId(null)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    batchSizeGroupId === null
                                      ? "bg-slate-900 text-white shadow-2xs"
                                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  Tüm Gruplar
                                </button>
                                {sizeGroups.map((sg: any) => (
                                  <button
                                    key={sg.id}
                                    type="button"
                                    onClick={() => setBatchSizeGroupId(sg.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                      batchSizeGroupId === sg.id
                                        ? "bg-slate-900 text-white shadow-2xs"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {sg.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. Beden Butonları & Beden Seçim Kontrolleri */}
                          <div className="p-3.5 space-y-2.5 bg-slate-50/40">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-semibold text-slate-800">
                                  {batchSizeGroupId
                                    ? `${sizeGroups.find((g: any) => g.id === batchSizeGroupId)?.name || ""} Bedenleri`
                                    : "Eklenecek Bedenler"}
                                </Label>
                                <span className="text-[10px] text-muted-foreground bg-slate-200/70 px-1.5 py-0.5 rounded-full font-medium">
                                  {filteredSizes.length} Beden
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[11px] font-medium text-slate-700 hover:text-primary hover:bg-primary/5 border-slate-300 bg-white px-2 shadow-2xs"
                                  onClick={handleSelectAllGroupSizes}
                                >
                                  <CheckCheck className="w-3 h-3 mr-1 text-primary" />
                                  {batchSizeGroupId ? "Bu Grubun Bedenlerini Seç" : "Tüm Bedenleri Seç"}
                                </Button>
                                {batchRows.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                                    onClick={() => setBatchRows([])}
                                  >
                                    Temizle
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Beden Butonları */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {filteredSizes.map((size: any) => {
                                const isSelected = batchRows.some((r) => r.sizeId === size.id);
                                const alreadyExists = existingVariantSizeIds.includes(size.id);

                                return (
                                  <button
                                    key={size.id}
                                    type="button"
                                    disabled={alreadyExists}
                                    onClick={() => handleToggleBatchSize(size)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                                      alreadyExists
                                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                                        : isSelected
                                        ? "border-primary bg-primary text-primary-foreground shadow-2xs font-semibold"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-primary/50"
                                    }`}
                                    title={alreadyExists ? "Bu renk ve beden kombinasyonu zaten ekli" : undefined}
                                  >
                                    {isSelected && <Check className="w-3 h-3" />}
                                    <span>{size.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 3. Seçilen Bedenler Tablosu (Stok, Fiyat Farkı, SKU, Barkod) */}
                        {batchRows.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <Label className="text-xs font-semibold text-slate-800">
                                3. Varyant Bilgileri ({batchRows.length} Beden Seçildi)
                              </Label>
                            </div>

                            {/* Hızlı Toplu Değer Doldurma Çubuğu */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl shadow-2xs">
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
                                    value={batchBulkStock}
                                    onChange={(e) => setBatchBulkStock(e.target.value)}
                                    className="h-7.5 w-24 text-center text-xs font-mono font-bold bg-white"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground font-medium">Fiyat Farkı:</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={batchBulkPriceDiff}
                                    onChange={(e) => setBatchBulkPriceDiff(e.target.value)}
                                    className="h-7.5 w-24 text-center text-xs font-mono font-bold bg-white"
                                  />
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={handleApplyBatchBulkStock}
                                  className="h-7.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                                >
                                  <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Tümüne Uygula
                                </Button>
                              </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-60 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Beden</th>
                                    <th className="text-center px-3 py-2 font-semibold text-slate-700">Stok Miktarı</th>
                                    <th className="text-center px-3 py-2 font-semibold text-slate-700">Fiyat Farkı (₺)</th>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-700">SKU (Opsiyonel)</th>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Barkod <span className="text-destructive">*</span></th>
                                    <th className="px-2 py-2"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {batchRows.map((row, idx) => (
                                    <tr key={row.sizeId} className="hover:bg-slate-50/50">
                                      <td className="px-3 py-2 font-bold text-slate-900">{row.sizeName}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          value={row.stockQuantity}
                                          onChange={(e) => updateBatchRow(idx, "stockQuantity", e.target.value)}
                                          className="h-8 w-20 text-center text-xs font-mono font-bold mx-auto"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0"
                                          value={row.priceDifference}
                                          onChange={(e) => updateBatchRow(idx, "priceDifference", e.target.value)}
                                          className="h-8 w-24 text-center text-xs font-mono font-bold mx-auto"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <Input
                                          placeholder="Otomatik"
                                          value={row.sku}
                                          onChange={(e) => updateBatchRow(idx, "sku", e.target.value)}
                                          className="h-8 w-28 text-xs font-mono"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="space-y-0.5">
                                          <Input
                                            placeholder="Barkod No *"
                                            value={row.barcode}
                                            onChange={(e) => updateBatchRow(idx, "barcode", e.target.value)}
                                            className={`h-8 w-32 text-xs font-mono transition-colors ${
                                              batchBarcodeErrors[idx] ? "border-destructive focus-visible:ring-destructive bg-rose-50/40 text-destructive" : ""
                                            }`}
                                            required
                                          />
                                          {batchBarcodeErrors[idx] && (
                                            <p className="text-[10px] text-destructive font-medium leading-none mt-0.5">{batchBarcodeErrors[idx]}</p>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-right">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                          onClick={() => handleRemoveBatchRow(row.sizeId)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between">
                          <Button type="button" variant="outline" size="sm" onClick={() => setIsVariantDialogOpen(false)} disabled={isSubmittingBatch}>
                            Vazgeç
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!batchColorId || batchRows.length === 0 || isSubmittingBatch}
                            className={`font-semibold transition-all ${
                              Object.keys(batchBarcodeErrors).length > 0
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                                : "bg-slate-900 hover:bg-slate-800 text-white"
                            }`}
                          >
                            {isSubmittingBatch ? (
                              <>
                                <Spinner className="mr-1.5" size="sm" /> Barkodlar Kontrol Ediliyor...
                              </>
                            ) : Object.keys(batchBarcodeErrors).length > 0 ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-1.5" /> Barkodları Düzeltin & Tekrar Dene
                              </>
                            ) : batchRows.length > 0 ? (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-1.5" /> {batchRows.length} Varyantı Doğrula & Ekle
                              </>
                            ) : (
                              "Varyant Ekle"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {isVariantsLoading || isProductColorsLoading || isImagesLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Spinner size="lg" />
                <span className="text-xs">Varyantlar yükleniyor...</span>
              </div>
            ) : productColors && productColors.length > 0 ? (
              <div className="space-y-5">
                {productColors.map((pc: any) => {
                  const color = globalColors?.find((c: any) => c.id === pc.colorId);
                  const colorVariants = variants?.filter((v: any) => v.productColorId === pc.id) || [];
                  const colorImages = images?.filter((img: any) => img.productColorId === pc.id) || [];
                  const totalStock = colorVariants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);

                  return (
                    <div key={pc.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/40 hover:bg-slate-50/70 transition-colors shadow-2xs">
                      {/* Renk Başlık ve Görsel Yönetimi */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border shadow-xs ring-2 ring-white" style={{ backgroundColor: color?.hexCode || "#ccc" }} />
                          <div>
                            <span className="font-bold text-sm text-slate-900">{color?.name || "Bilinmeyen Renk"}</span>
                            <span className="ml-2 text-xs text-muted-foreground">Toplam Stok: <strong className="text-slate-800">{totalStock}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mini Thumbnail Önizleme Şeridi */}
                          {colorImages.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden items-center mr-1">
                              {colorImages.slice(0, 3).map((ci: any) => (
                                <div key={ci.id} className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-white shadow-xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={getImageUrl(ci.imageUrl)} alt="thumb" className="h-full w-full object-cover" />
                                </div>
                              ))}
                              {colorImages.length > 3 && (
                                <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-[10px] font-bold text-slate-600 items-center justify-center">
                                  +{colorImages.length - 3}
                                </div>
                              )}
                            </div>
                          )}

                          {!isViewer && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs font-semibold bg-white shadow-2xs hover:bg-slate-100" 
                              onClick={() => {
                                setActiveImageColorId(pc.id);
                                setNewImage({ ...newImage, globalColorId: pc.colorId });
                                setIsImageDialogOpen(true);
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              Görseller ({colorImages.length}/5)
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Beden ve Stok Tablosu */}
                      <div className="space-y-2">
                        {colorVariants.length > 0 ? (
                          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-2.5">Beden</th>
                                  <th className="px-4 py-2.5">Stok Adedi</th>
                                  <th className="px-4 py-2.5">Fiyat Farkı</th>
                                  {!isViewer && <th className="px-4 py-2.5 text-right">İşlem</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {colorVariants.map((variant: any) => {
                                  const size = globalSizes?.find((s: any) => s.id === variant.sizeId);
                                  const isEditing = editingVariantId === variant.id;
                                  return (
                                    <tr key={variant.id} className="hover:bg-slate-50/60 transition-colors">
                                      <td className="px-4 py-2.5 font-bold text-slate-800">{size?.name || "-"}</td>
                                      <td className="px-4 py-2.5">
                                        {isEditing ? (
                                          <Input 
                                            type="number" 
                                            min="0"
                                            placeholder="0"
                                            className="h-8 w-20 text-center text-xs font-mono font-bold" 
                                            value={variantUpdates[variant.id]?.stockQuantity !== undefined ? variantUpdates[variant.id]?.stockQuantity : (variant.stockQuantity === 0 ? "" : variant.stockQuantity)}
                                            onChange={(e) => setVariantUpdates(prev => ({ 
                                              ...prev, 
                                              [variant.id]: { ...prev[variant.id], stockQuantity: e.target.value } 
                                            }))}
                                          />
                                        ) : (
                                          <Badge 
                                            variant="outline" 
                                            className={`text-[11px] font-semibold ${
                                              variant.stockQuantity > 5 
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                : variant.stockQuantity > 0 
                                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}
                                          >
                                            {variant.stockQuantity} Adet
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {isEditing ? (
                                          <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0"
                                            className="h-8 w-20 text-center text-xs font-mono font-bold" 
                                            value={variantUpdates[variant.id]?.priceDifference !== undefined ? variantUpdates[variant.id]?.priceDifference : (variant.priceDifference === 0 ? "" : variant.priceDifference)}
                                            onChange={(e) => setVariantUpdates(prev => ({ 
                                              ...prev, 
                                              [variant.id]: { ...prev[variant.id], priceDifference: e.target.value } 
                                            }))}
                                          />
                                        ) : (
                                          <span className={variant.priceDifference > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                                            {variant.priceDifference > 0 ? `+${variant.priceDifference} TL` : "0 TL"}
                                          </span>
                                        )}
                                      </td>
                                      {!isViewer && (
                                        <td className="px-4 py-2.5 text-right">
                                          {isEditing ? (
                                            <div className="flex justify-end gap-1">
                                              <Button size="icon" variant="ghost" onClick={() => handleVariantSave(variant.id, variant)} className="h-7 w-7 text-emerald-600 hover:bg-emerald-50">
                                                <Check className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button size="icon" variant="ghost" onClick={() => {
                                                setEditingVariantId(null);
                                                setVariantUpdates(prev => {
                                                  const next = { ...prev };
                                                  delete next[variant.id];
                                                  return next;
                                                });
                                              }} className="h-7 w-7 text-slate-400 hover:text-slate-600">
                                                <X className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-7 w-7 text-slate-500 hover:text-slate-900" 
                                              onClick={() => {
                                                setEditingVariantId(variant.id);
                                                setVariantUpdates(prev => ({
                                                  ...prev,
                                                  [variant.id]: { stockQuantity: variant.stockQuantity, priceDifference: variant.priceDifference }
                                                }));
                                              }}
                                              title="Düzenle"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground border border-dashed rounded-xl p-5 text-center bg-white">
                            Bu renge henüz beden ve stok tanımlanmamış.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl bg-slate-50/50">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">Bu ürüne henüz renk ve varyant eklenmemiş.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Yukarıdaki &quot;Varyant Ekle&quot; butonuyla başlayabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAHİL OLDUĞU KOMBİNLER */}
      {activeTab === "outfits" && (
        <div className="space-y-6">
          <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Dahil Olduğu Kombinler</h2>
                  <p className="text-xs text-muted-foreground">
                    Bu ürünün yer aldığı kombin setleri ve set satış fiyatları
                  </p>
                </div>
              </div>
            </div>

            {isProductOutfitsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Spinner className="w-8 h-8 text-amber-600 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Kombinler Getiriliyor...</p>
                <p className="text-xs text-muted-foreground">Lütfen bekleyiniz</p>
              </div>
            ) : productOutfits && productOutfits.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productOutfits.map((outfit) => (
                    <div
                      key={outfit.outfitId}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between gap-4 shadow-2xs hover:border-amber-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                          {outfit.coverImageUrl ? (
                            <img
                              src={getImageUrl(outfit.coverImageUrl)}
                              alt={outfit.outfitTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {outfit.outfitTitle}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {outfit.itemCount ?? outfit.totalPiecesCount ?? 0} Parça Ürün
                          </p>
                          <p className="text-[11px] font-medium text-slate-700">
                            Parça Toplamı: {(outfit.totalOriginalPrice ?? outfit.currentItemsTotalPrice ?? 0).toLocaleString("tr-TR")} ₺
                          </p>
                          <Link
                            href="/admin/outfits"
                            className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-2.5 py-1 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Düzenle
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
                        <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                          Kombin Set Fiyatı:
                        </Label>
                        <div className="w-36 relative">
                          <Input
                            type="number"
                            min="0"
                            value={outfitPrices[outfit.outfitId] ?? outfit.currentOutfitPrice}
                            onChange={(e) =>
                              setOutfitPrices({
                                ...outfitPrices,
                                [outfit.outfitId]: Number(e.target.value),
                              })
                            }
                            disabled={isViewer}
                            className="h-9 text-sm font-bold pr-8 text-right bg-white"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Toplam <span className="font-semibold text-slate-900">{productOutfits.length}</span> kombin listeleniyor
                  </p>
                  {!isViewer && (
                    <Button
                      type="button"
                      onClick={handleSaveOutfitPrices}
                      disabled={isUpdatingOutfitPrices}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9"
                    >
                      {isUpdatingOutfitPrices ? (
                        <>
                          <Spinner className="w-3.5 h-3.5 mr-2" />
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Kombin Fiyatlarını Güncelle
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl p-8 space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Bu ürün henüz herhangi bir kombine eklenmemiş</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Ürünü kombinlerde kullanmak ve set fiyatları tanımlamak için Kombinler modülünden yeni bir kombin oluşturabilirsiniz.
                </p>
                <div className="pt-2">
                  <Link
                    href="/admin/outfits"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    + Yeni Kombin Oluştur
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modallar */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
                    setIsImageDialogOpen(open);
                    if (!open) {
                      setActiveImageColorId(null);
                      setNewImage({ file: null, globalColorId: "", isMain: false, isProductMain: false });
                    }
                  }}>
                    <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white shadow-2xl">
                      {(() => {
                        const pc = productColors?.find((p: any) => p.id === activeImageColorId);
                        const color = globalColors?.find((c: any) => c.id === pc?.colorId);
                        const activeImages = images?.filter((img: any) => img.productColorId === activeImageColorId) || [];
                        const canAddMore = activeImages.length < 5;

                        return (
                          <div className="space-y-6">
                            {/* Modal Başlığı */}
                            <div className="flex items-center justify-between pb-4 border-b">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-5 h-5 rounded-full border shadow-sm ring-2 ring-slate-100" 
                                  style={{ backgroundColor: color?.hexCode || "#ccc" }} 
                                />
                                <div>
                                  <DialogTitle className="text-lg font-bold text-slate-900">
                                    {color ? `${color.name} Görselleri` : "Görselleri Yönet"}
                                  </DialogTitle>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Bu renge ait görselleri görüntüleyebilir, vitrin veya ana renk atayabilirsiniz.
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={canAddMore ? "outline" : "destructive"} 
                                className="font-semibold text-xs px-3 py-1 bg-slate-50"
                              >
                                {activeImages.length} / 5 Görsel
                              </Badge>
                            </div>

                            {/* 1. Kısım: Mevcut Görseller Galerisi */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-slate-500" /> Mevcut Görseller ({activeImages.length})
                                </h3>
                                <span className="text-[11px] text-muted-foreground">İşlem yapmak için görselin üzerine gelin</span>
                              </div>

                              {activeImages.length === 0 ? (
                                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/60 text-slate-400">
                                  <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                                  <p className="text-xs font-medium text-slate-600">Bu renge ait henüz görsel yüklenmedi.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                                  {activeImages.map((img: any) => (
                                    <div 
                                      key={img.id} 
                                      className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] shadow-xs bg-slate-100 transition-all duration-200 hover:shadow-md hover:border-slate-300"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={getImageUrl(img.imageUrl)} 
                                        alt="product" 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Gorsel+Bulunamadi';
                                        }}
                                      />
                                      
                                      {/* Normal Görünümde Aktif Rozetler */}
                                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none transition-opacity duration-200 group-hover:opacity-0">
                                        {img.isProductMain && (
                                          <span className="inline-flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                            <Star className="w-2.5 h-2.5 fill-current" /> Vitrin
                                          </span>
                                        )}
                                        {img.isMain && (
                                          <span className="inline-flex items-center gap-1 bg-amber-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                            <Palette className="w-2.5 h-2.5" /> Ana Renk
                                          </span>
                                        )}
                                      </div>

                                      {/* Hover Durumunda Açılan Eylemler */}
                                      {!isViewer && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2 z-20">
                                          <div className="flex justify-end">
                                            <button 
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setImageToDelete(img.id);
                                              }}
                                              className="h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 hover:scale-105"
                                              title="Görseli Sil"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <div className="flex flex-col gap-1 w-full">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleImageFlags(img, "isProductMain", !img.isProductMain);
                                              }}
                                              className={`w-full py-1 px-1 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 ${
                                                img.isProductMain 
                                                  ? 'bg-emerald-600 text-white ring-1 ring-emerald-400' 
                                                  : 'bg-white/20 hover:bg-white/35 text-white backdrop-blur-md border border-white/20'
                                              }`}
                                            >
                                              <Star className="w-2.5 h-2.5" fill={img.isProductMain ? "currentColor" : "none"} />
                                              <span>{img.isProductMain ? "Vitrin" : "Vitrin Yap"}</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleImageFlags(img, "isMain", !img.isMain);
                                              }}
                                              className={`w-full py-1 px-1 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 ${
                                                img.isMain 
                                                  ? 'bg-amber-600 text-white ring-1 ring-amber-400' 
                                                  : 'bg-white/20 hover:bg-white/35 text-white backdrop-blur-md border border-white/20'
                                              }`}
                                            >
                                              <Palette className="w-2.5 h-2.5" />
                                              <span>{img.isMain ? "Ana Renk" : "Ana Renk Yap"}</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 2. Kısım: Yeni Görsel Ekle Formu */}
                            <div className="pt-5 border-t space-y-4">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <UploadCloud className="w-4 h-4 text-slate-500" /> Yeni Görsel Yükle
                              </h3>

                              {!canAddMore ? (
                                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                                  <span>Bu renk için maksimum 5 görsel sınırına ulaşıldı. Yeni görsel yüklemek için önce mevcut bir görseli silin.</span>
                                </div>
                              ) : (
                                <form onSubmit={handleAddImage} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                                  {/* Dosya Seçme / Önizleme (5 Kolon) */}
                                  <div className="md:col-span-5">
                                    {!newImage.file ? (
                                      <label className="border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-3 flex items-center justify-center gap-2.5 cursor-pointer transition-all text-center">
                                        <UploadCloud className="w-5 h-5 text-slate-400" />
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Dosya Seçin</p>
                                          <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP</p>
                                        </div>
                                        <input 
                                          type="file" 
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => setNewImage({ ...newImage, file: e.target.files?.[0] || null })}
                                        />
                                      </label>
                                    ) : (
                                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img 
                                            src={URL.createObjectURL(newImage.file)} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-slate-800 truncate">{newImage.file.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{(newImage.file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-slate-400 hover:text-red-600 rounded-full"
                                          onClick={() => setNewImage({ ...newImage, file: null })}
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Seçenek Anahtarları (4 Kolon) */}
                                  <div className="md:col-span-4 space-y-2">
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80">
                                      <Label className="text-[11px] font-medium flex items-center gap-1.5 cursor-pointer">
                                        <Star className="w-3 h-3 text-emerald-600" /> Vitrin Görseli
                                      </Label>
                                      <Switch 
                                        checked={newImage.isProductMain}
                                        onCheckedChange={(c) => setNewImage({ ...newImage, isProductMain: c })}
                                        className="scale-75"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80">
                                      <Label className="text-[11px] font-medium flex items-center gap-1.5 cursor-pointer">
                                        <Palette className="w-3 h-3 text-amber-600" /> Ana Renk Görseli
                                      </Label>
                                      <Switch 
                                        checked={newImage.isMain}
                                        onCheckedChange={(c) => setNewImage({ ...newImage, isMain: c })}
                                        className="scale-75"
                                      />
                                    </div>
                                  </div>

                                  {/* Yükle Butonu (3 Kolon) */}
                                  <div className="md:col-span-3">
                                    <Button 
                                      type="submit" 
                                      className="w-full h-10 font-semibold text-xs shadow-sm"
                                      disabled={!newImage.file || addProductImageMutation.isPending}
                                    >
                                      {addProductImageMutation.isPending ? (
                                        <Spinner size="sm" className="mr-1.5" />
                                      ) : (
                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                      )}
                                      Görseli Yükle
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </div>

                            {/* Modal Kapat Butonu */}
                            <div className="flex justify-end pt-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsImageDialogOpen(false)}
                              >
                                Kapat
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </DialogContent>
                  </Dialog>

      <Dialog open={isOutfitsModalOpen} onOpenChange={setIsOutfitsModalOpen}>
            <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      Dahil Olduğu Kombinler
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {isPriceChangeTriggered
                        ? "Ürün fiyatı değişti! İlgili kombinlerin set fiyatlarını aşağıdan kontrol edip güncelleyebilirsiniz."
                        : "Bu ürünün yer aldığı kombinler ve set satış fiyatları."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {isPriceChangeTriggered && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Ürün satış veya indirimli fiyatı değişti. Bu ürünün yer aldığı kombinlerin set fiyatlarını aşağıdan kontrol edebilirsiniz.</span>
                </div>
              )}

              {isProductOutfitsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner className="w-6 h-6 text-amber-600" />
                  <p className="text-xs text-muted-foreground mt-2">Kombinler getiriliyor...</p>
                </div>
              ) : productOutfits && productOutfits.length > 0 ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productOutfits.map((outfit) => (
                      <div
                        key={outfit.outfitId}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                            {outfit.coverImageUrl ? (
                              <img
                                src={getImageUrl(outfit.coverImageUrl)}
                                alt={outfit.outfitTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {outfit.outfitTitle}
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {outfit.itemCount ?? outfit.totalPiecesCount ?? 0} Parça Ürün · Parça Toplamı: {(outfit.totalOriginalPrice ?? outfit.currentItemsTotalPrice ?? 0).toLocaleString("tr-TR")} ₺
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                          <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                            Kombin Set Fiyatı (₺):
                          </Label>
                          <div className="w-32 relative">
                            <Input
                              type="number"
                              min="0"
                              value={outfitPrices[outfit.outfitId] ?? outfit.currentOutfitPrice}
                              onChange={(e) =>
                                setOutfitPrices({
                                  ...outfitPrices,
                                  [outfit.outfitId]: Number(e.target.value),
                                })
                              }
                              disabled={isViewer}
                              className="h-8 text-xs font-bold pr-7 text-right bg-white"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              TL
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <DialogFooter className="pt-3 border-t flex flex-row items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOutfitsModalOpen(false)}
                    >
                      Kapat
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveOutfitPrices}
                      disabled={isViewer || isUpdatingOutfitPrices}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                    >
                      {isUpdatingOutfitPrices ? (
                        <>
                          <Spinner className="w-3.5 h-3.5 mr-2" />
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Kombin Fiyatlarını Güncelle
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Bu ürün henüz herhangi bir kombine eklenmemiş.</p>
                  <p className="text-xs">Ürünü kombinlerde kullanmak için Kombinler modülünden yeni kombin oluşturabilirsiniz.</p>
                  <Link
                    href="/admin/outfits"
                    className="text-primary hover:underline font-semibold text-xs inline-block pt-1"
                  >
                    + Yeni Kombin Oluştur
                  </Link>
                </div>
              )}
            </DialogContent>
          </Dialog>

      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görseli Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu görseli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImageConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
