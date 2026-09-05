"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useProductById, useUpdateProduct } from "@/hooks/useProducts";
import { useOutfitsByProductId, useBulkUpdateOutfitPrices } from "@/hooks/useOutfits";
import { toast } from "sonner";
import { getMinioUrl } from "@/lib/utils";
import {
  Tag,
  Sparkles,
  Save,
  Boxes,
  Layers,
  TrendingDown,
  Info,
  Image as ImageIcon,
} from "lucide-react";
import { Product } from "@/types/api.types";

interface QuickPriceDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickPriceDialog({
  product: initialProduct,
  open,
  onOpenChange,
}: QuickPriceDialogProps) {
  const productId = initialProduct?.id || 0;

  // Ürünün tam detaylarını ve dahil olduğu kombinleri çek
  const { data: fullProductData, isLoading: isProductLoading } = useProductById(productId);
  const { data: outfitsData, isLoading: isOutfitsLoading } = useOutfitsByProductId(productId, open && productId > 0);

  const product = (fullProductData as any)?.data || fullProductData || initialProduct;
  const outfits = Array.isArray(outfitsData) ? outfitsData : (outfitsData as any)?.data || [];

  const updateProductMutation = useUpdateProduct();
  const bulkUpdateOutfitPricesMutation = useBulkUpdateOutfitPrices();

  // Fiyat State'leri
  const [basePrice, setBasePrice] = useState<string | number>("");
  const [discountPrice, setDiscountPrice] = useState<string | number>("");
  const [outfitPrices, setOutfitPrices] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Modal açıldığında mevcut fiyatları yükle
  useEffect(() => {
    if (product && open) {
      setBasePrice(product.basePrice ?? "");
      setDiscountPrice(product.discountPrice ?? "");
    }
  }, [product, open]);

  // Kombinler yüklendiğinde mevcut kombin fiyatlarını state'e aktar
  useEffect(() => {
    if (outfits && outfits.length > 0 && open) {
      setOutfitPrices((prev) => {
        const next = { ...prev };
        outfits.forEach((o: any) => {
          if (next[o.outfitId] === undefined) {
            next[o.outfitId] = Number(o.currentOutfitPrice ?? o.price ?? 0);
          }
        });
        return next;
      });
    }
  }, [outfits, open]);

  const handleSave = async () => {
    if (!product) return;

    const numBasePrice = Number(basePrice);
    if (isNaN(numBasePrice) || numBasePrice < 0) {
      toast.error("Geçerli bir satış fiyatı giriniz.");
      return;
    }

    const numDiscountPrice = discountPrice !== "" && discountPrice !== null && discountPrice !== undefined
      ? Number(discountPrice)
      : undefined;

    if (numDiscountPrice !== undefined && (isNaN(numDiscountPrice) || numDiscountPrice < 0)) {
      toast.error("Geçerli bir indirimli fiyat giriniz.");
      return;
    }

    if (numDiscountPrice !== undefined && numDiscountPrice >= numBasePrice) {
      toast.warning("İndirimli fiyat, normal satış fiyatından düşük olmalıdır.");
    }

    setIsSaving(true);
    try {
      // 1. Ürün Fiyatını Güncelle
      const updatePayload = {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        productGroupId: product.productGroupId,
        brandId: product.brandId,
        description: product.description || "",
        basePrice: numBasePrice,
        discountPrice: numDiscountPrice,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        isFeatured: Boolean(product.isFeatured),
        isBestSeller: Boolean(product.isBestSeller),
        isNewArrival: Boolean(product.isNewArrival),
        displayOrder: Number(product.displayOrder || 0),
        slug: product.slug,
        featureIds: (product as any).featureIds || (product as any).features?.map((f: any) => f.id) || [],
      };

      await updateProductMutation.mutateAsync(updatePayload);

      // 2. Kombin Fiyatları Varsa Güncelle
      if (outfits.length > 0) {
        const updates = outfits.map((o: any) => ({
          outfitId: o.outfitId,
          newPrice: Number(outfitPrices[o.outfitId] ?? o.currentOutfitPrice ?? o.price ?? 0),
        }));

        await bulkUpdateOutfitPricesMutation.mutateAsync(updates);
      }

      toast.success(
        outfits.length > 0
          ? "Ürün fiyatı ve dahil olduğu kombinlerin fiyatları başarıyla güncellendi."
          : "Ürün fiyatı başarıyla güncellendi."
      );
      onOpenChange(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.Message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error?.response?.data : null) ||
        "Fiyat güncellenirken bir hata oluştu.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const imgUrl = product?.primaryImageUrl ? getMinioUrl(product.primaryImageUrl) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <DialogTitle>Hızlı Fiyat & Kombin Yönetimi</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Ürünün satış fiyatını güncelleyin. Bu ürün kombinlerde yer alıyorsa kombin set fiyatlarını da tekil olarak revize edebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Ürün Özet Bilgi Kartı */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="w-13 h-15 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={product?.name || "Ürün"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Boxes className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {product?.name}
                </h4>
                {product?.categoryName && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-200/70 text-slate-700">
                    {product.categoryName}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {product?.slug}
              </p>
              <div className="flex items-center gap-3 text-xs pt-0.5">
                <span className="text-slate-600">
                  Mevcut Fiyat: <strong className="text-slate-900">{Number(product?.basePrice || 0).toLocaleString("tr-TR")} ₺</strong>
                </span>
                {product?.discountPrice ? (
                  <span className="text-emerald-600">
                    İndirimli: <strong>{Number(product.discountPrice).toLocaleString("tr-TR")} ₺</strong>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Fiyat Giriş Alanları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Satış Fiyatı (₺)</span>
                <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="pr-8 font-bold text-sm bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₺
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>İndirimli Fiyat (₺)</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="İndirim yoksa boş bırakın"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="pr-8 font-bold text-sm bg-white text-emerald-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₺
                </span>
              </div>
            </div>
          </div>

          {/* Kombin Yönetimi & Bilgilendirme Bölümü */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Dahil Olduğu Kombinler
                </h3>
              </div>
              {outfits.length > 0 && (
                <Badge variant="outline" className="text-[11px] bg-amber-50 border-amber-300 text-amber-800 font-semibold">
                  {outfits.length} Kombin Mevcut
                </Badge>
              )}
            </div>

            {isOutfitsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed">
                <Spinner className="w-5 h-5 text-amber-600 mr-2" />
                <span className="text-xs">Kombin bilgileri kontrol ediliyor...</span>
              </div>
            ) : outfits.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Bu ürün <strong>{outfits.length} adet kombinde</strong> yer almaktadır. Ürünün fiyatını değiştirdiğinizde kombin set fiyatlarını da aşağıdan tekil olarak güncelleyebilirsiniz.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {outfits.map((outfit: any) => {
                    const coverUrl = outfit.coverImageUrl || outfit.outfitCoverImageUrl
                      ? getMinioUrl(outfit.coverImageUrl || outfit.outfitCoverImageUrl)
                      : "";
                    const count = outfit.itemCount ?? outfit.totalPiecesCount ?? 0;
                    const origTotal = outfit.totalOriginalPrice ?? outfit.currentItemsTotalPrice ?? 0;

                    return (
                      <div
                        key={outfit.outfitId}
                        className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between gap-3 shadow-2xs hover:border-amber-400/70 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-12 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
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
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={outfit.outfitTitle}>
                              {outfit.outfitTitle}
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {count} Parça · Toplam: {Number(origTotal).toLocaleString("tr-TR")} ₺
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                          <Label className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                            Kombin Set Fiyatı:
                          </Label>
                          <div className="w-28 relative">
                            <Input
                              type="number"
                              min="0"
                              value={outfitPrices[outfit.outfitId] ?? outfit.currentOutfitPrice ?? outfit.price ?? ""}
                              onChange={(e) =>
                                setOutfitPrices({
                                  ...outfitPrices,
                                  [outfit.outfitId]: Number(e.target.value),
                                })
                              }
                              className="h-8 text-xs font-bold pr-6 text-right bg-white"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              ₺
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-xl p-4 bg-slate-50/40 text-xs">
                Bu ürün henüz herhangi bir kombine dahil edilmemiş.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50/70 flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isProductLoading}
            className="bg-primary text-primary-foreground font-semibold text-xs h-9 px-4"
          >
            {isSaving ? (
              <>
                <Spinner className="w-3.5 h-3.5 mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Fiyatları Güncelle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
