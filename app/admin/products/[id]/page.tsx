"use client";

import { useState, useEffect } from "react";
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
  TrendingUp,
  Clock,
  Layers,
  Check,
  Pencil
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
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useColors } from "@/hooks/useColors";
import { useSizes } from "@/hooks/useSizes";
import { UpdateProductDto } from "@/types/api.types";

const getImageUrl = (url: string) => {
  if (!url) return "/placeholder-image.jpg";
  if (url.startsWith("http")) return url;
  
  // Eğer url '/' ile başlıyorsa Minio bucket path'idir (örn: /backendbucket/...)
  if (url.startsWith("/")) {
    return `http://localhost:9000${url}`;
  }
  
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/Uploads/Images/${url}`;
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

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || [];
  const brands = Array.isArray(brandsData) ? brandsData : (brandsData as any)?.data || [];
  const globalColors = Array.isArray(globalColorsData) ? globalColorsData : (globalColorsData as any)?.data || [];
  const globalSizes = Array.isArray(globalSizesData) ? globalSizesData : (globalSizesData as any)?.data || [];

  const updateProductMutation = useUpdateProduct();
  const updateProductVariantMutation = useUpdateProductVariant();
  const addProductVariantMutation = useAddProductVariant();
  const addProductImageMutation = useAddProductImage();
  const updateProductImageMutation = useUpdateProductImage();
  const deleteProductImageMutation = useDeleteProductImage();
  const addProductColorMutation = useAddProductColor();

  // State
  const [formData, setFormData] = useState<UpdateProductDto | null>(null);

  // Varyantları inline düzenleme için state
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantUpdates, setVariantUpdates] = useState<Record<number, { stockQuantity?: number; priceDifference?: number }>>({});

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

  // Variant Add State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({
    globalColorId: "",
    sizeId: "",
    stockQuantity: 0,
    priceDifference: 0,
    sku: "",
    barcode: ""
  });

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
      });
    }
  }, [product]);

  const handleBaseSave = () => {
    if (!formData) return;
    updateProductMutation.mutate(formData, {
      onSuccess: () => toast.success("Ürün bilgileri başarıyla güncellendi."),
      onError: () => toast.error("Ürün güncellenirken bir hata oluştu.")
    });
  };

  const handleVariantSave = (variantId: number, originalData: any) => {
    const current = variantUpdates[variantId];
    if (!current) return;
    
    updateProductVariantMutation.mutate({ 
      id: variantId, 
      ...originalData,
      stockQuantity: current.stockQuantity ?? originalData.stockQuantity,
      priceDifference: current.priceDifference ?? originalData.priceDifference
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

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.globalColorId || !newVariant.sizeId) {
      toast.error("Lütfen renk ve beden seçin");
      return;
    }
    if (!newVariant.sku || !newVariant.sku.trim()) {
      toast.error("Lütfen SKU kodunu girin");
      return;
    }
    if (!newVariant.barcode || !newVariant.barcode.trim()) {
      toast.error("Lütfen barkod numarasını girin");
      return;
    }

    const selectedGlobalColorId = Number(newVariant.globalColorId);
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

      const promise = addProductVariantMutation.mutateAsync({
        productColorId: targetProductColorId,
        sizeId: Number(newVariant.sizeId),
        stockQuantity: newVariant.stockQuantity,
        priceDifference: newVariant.priceDifference,
        sku: newVariant.sku,
        barcode: newVariant.barcode
      });

      toast.promise(promise, {
        loading: "Varyant ekleniyor...",
        success: () => {
          setIsVariantDialogOpen(false);
          setNewVariant({ globalColorId: "", sizeId: "", stockQuantity: 0, priceDifference: 0, sku: "", barcode: "" });
          return "Varyant başarıyla eklendi";
        },
        error: (err: any) => `Varyant eklenemedi: ${err.response?.data || err.message}`
      });
    } catch (err: any) {
      toast.error("Varyant kaydedilirken hata oluştu", { description: err.message });
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
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon (Temel Bilgiler & Varyantlar) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Temel Bilgiler Kartı */}
          <div className="bg-card border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Temel Bilgiler</h2>
                <p className="text-xs text-muted-foreground">Ürünün ana başlık, URL ve kategori tanımlamaları</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Ürün Adı</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  disabled={isViewer} 
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">URL (Slug)</Label>
                <Input 
                  value={formData.slug} 
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                  disabled={isViewer} 
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Kategori</Label>
                <Select
                  disabled={isViewer}
                  value={String(formData.categoryId)}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: Number(val) })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Kategori Seçin">
                      {categories?.find((c: any) => String(c.id) === String(formData.categoryId))?.name || "Kategori Seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
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

              <div className="md:col-span-2 space-y-1.5">
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
                    <DialogContent className="sm:max-w-md p-6 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-bold">Yeni Varyant Ekle</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddVariant} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-0.5">
                              Renk <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={String(newVariant.globalColorId || "")}
                              onValueChange={(val) => setNewVariant({ ...newVariant, globalColorId: val })}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Renk Seçin">
                                  {(() => {
                                    const sc = globalColors?.find((c: any) => String(c.id) === String(newVariant.globalColorId));
                                    return sc ? (
                                      <div className="flex items-center gap-2 text-xs">
                                        <div className="w-3 h-3 rounded-full border shadow-2xs" style={{ backgroundColor: sc.hexCode }} />
                                        <span>{sc.name}</span>
                                      </div>
                                    ) : "Renk Seçin";
                                  })()}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {globalColors?.map((c: any) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className="w-3 h-3 rounded-full border shadow-2xs" style={{ backgroundColor: c.hexCode }} />
                                      {c.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-0.5">
                              Beden <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={String(newVariant.sizeId || "")}
                              onValueChange={(val) => setNewVariant({ ...newVariant, sizeId: val })}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Beden Seçin">
                                  {globalSizes?.find((s: any) => String(s.id) === String(newVariant.sizeId))?.name || "Beden Seçin"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {globalSizes?.map((s: any) => (
                                  <SelectItem key={s.id} value={String(s.id)}>
                                    <span className="text-xs font-medium">{s.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Stok Miktarı</Label>
                            <Input 
                              type="number" 
                              min="0"
                              value={newVariant.stockQuantity}
                              onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: Number(e.target.value) })}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Fiyat Farkı (TL)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={newVariant.priceDifference}
                              onChange={(e) => setNewVariant({ ...newVariant, priceDifference: Number(e.target.value) })}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-0.5">
                              SKU <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                              value={newVariant.sku}
                              onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                              className="h-9 text-xs"
                              placeholder="Örn: HKN-TSH-01"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-0.5">
                              Barkod <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                              value={newVariant.barcode}
                              onChange={(e) => setNewVariant({ ...newVariant, barcode: e.target.value })}
                              className="h-9 text-xs"
                              placeholder="Örn: 869000123"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter className="pt-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setIsVariantDialogOpen(false)}>İptal</Button>
                          <Button type="submit" size="sm" className="font-semibold">Kaydet</Button>
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
                                            className="h-7 w-20 text-xs" 
                                            value={variantUpdates[variant.id]?.stockQuantity ?? variant.stockQuantity}
                                            onChange={(e) => setVariantUpdates(prev => ({ 
                                              ...prev, 
                                              [variant.id]: { ...prev[variant.id], stockQuantity: Number(e.target.value) } 
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
                                            className="h-7 w-20 text-xs" 
                                            value={variantUpdates[variant.id]?.priceDifference ?? variant.priceDifference}
                                            onChange={(e) => setVariantUpdates(prev => ({ 
                                              ...prev, 
                                              [variant.id]: { ...prev[variant.id], priceDifference: Number(e.target.value) } 
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

        {/* Sağ Kolon (Fiyat, İndirim & Görünürlük) */}
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

          {/* Görünürlük & Etiketler Kartı */}
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
                  value={formData.displayOrder} 
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })} 
                  disabled={isViewer} 
                  className="h-9 text-xs mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Düşük sayılar listelerde daha önce görünür.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

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
