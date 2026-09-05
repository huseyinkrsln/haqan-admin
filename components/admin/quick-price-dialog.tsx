"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useProductById, useUpdateProductPrice } from "@/hooks/useProducts";
import { useOutfitsByProductId, useBulkUpdateOutfitPrices } from "@/hooks/useOutfits";
import { toast } from "sonner";
import { getMinioUrl } from "@/lib/utils";
import {
  Tag,
  Save,
  Zap,
  Check,
  TrendingDown,
  Info,
  RotateCcw,
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

  const updateProductPriceMutation = useUpdateProductPrice();
  const bulkUpdateOutfitPricesMutation = useBulkUpdateOutfitPrices();

  // Fiyat State'leri
  const [basePrice, setBasePrice] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [outfitPrices, setOutfitPrices] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Modal açıldığında mevcut fiyatları yükle
  useEffect(() => {
    if (product && open) {
      setBasePrice(
        product.basePrice !== undefined && product.basePrice !== null
          ? String(product.basePrice)
          : ""
      );
      setDiscountPrice(
        product.discountPrice !== undefined && product.discountPrice !== null
          ? String(product.discountPrice)
          : ""
      );
    }
  }, [product, open]);

  // Kombinler yüklendiğinde mevcut kombin fiyatlarını state'e aktar
  useEffect(() => {
    if (outfits && outfits.length > 0 && open) {
      setOutfitPrices((prev) => {
        const next = { ...prev };
        outfits.forEach((o: any) => {
          if (next[o.outfitId] === undefined) {
            const rawVal = o.currentOutfitPrice ?? o.price;
            next[o.outfitId] = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";
          }
        });
        return next;
      });
    }
  }, [outfits, open]);

  // Fiyat Farkı Hesaplamaları
  const originalBasePrice = Number(product?.basePrice || 0);
  const parsedNewBasePrice = basePrice !== "" && !isNaN(Number(basePrice)) ? Number(basePrice) : originalBasePrice;
  const priceDiff = parsedNewBasePrice - originalBasePrice;
  const percentDiff = originalBasePrice > 0 ? ((priceDiff / originalBasePrice) * 100).toFixed(1) : "0";

  // Farkın tüm kombinlere yansıtılıp yansıtılmadığını kontrol et
  const isDiffAppliedToAll = useMemo(() => {
    if (outfits.length === 0 || priceDiff === 0) return false;
    return outfits.every((o: any) => {
      const orig = Number(o.currentOutfitPrice ?? o.price ?? 0);
      const target = Math.max(0, orig + priceDiff);
      const currentVal = outfitPrices[o.outfitId];
      return currentVal !== undefined && Number(currentVal) === target;
    });
  }, [outfits, outfitPrices, priceDiff]);

  // Fiyat farkını tüm kombinlere yansıt
  const handleApplyDiffToAll = () => {
    if (outfits.length === 0) return;
    const next: Record<number, string> = {};
    outfits.forEach((o: any) => {
      const orig = Number(o.currentOutfitPrice ?? o.price ?? 0);
      const newOutfitPrice = Math.max(0, orig + priceDiff);
      next[o.outfitId] = String(newOutfitPrice);
    });
    setOutfitPrices(next);
    toast.success("Fiyat farkı tüm kombinlere uygulandı.");
  };

  // Hızlı oran / yüzde uygula
  const handleApplyPercentage = (percentage: number) => {
    if (outfits.length === 0) return;
    const next: Record<number, string> = {};
    outfits.forEach((o: any) => {
      const orig = Number(o.currentOutfitPrice ?? o.price ?? 0);
      const calculated = Math.round(orig * (1 + percentage / 100));
      next[o.outfitId] = String(calculated);
    });
    setOutfitPrices(next);
    toast.info(`Tüm kombinlere +%${percentage} artış uygulandı.`);
  };

  // Orijinal fiyatlara geri sıfırla
  const handleResetOutfitPrices = () => {
    if (outfits.length === 0) return;
    const next: Record<number, string> = {};
    outfits.forEach((o: any) => {
      const orig = o.currentOutfitPrice ?? o.price ?? 0;
      next[o.outfitId] = String(orig);
    });
    setOutfitPrices(next);
    toast.info("Kombin fiyatları orijinal değerlerine sıfırlandı.");
  };

  const handleSave = async () => {
    if (!product) return;

    if (basePrice === "" || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      toast.error("Geçerli bir satış fiyatı giriniz.");
      return;
    }

    const numBasePrice = Number(basePrice);
    const numDiscountPrice =
      discountPrice !== "" && discountPrice !== null && discountPrice !== undefined
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
      // 1. Sadece Ürün Fiyatını Güncelle (Özel ve hafif endpoint)
      await updateProductPriceMutation.mutateAsync({
        productId: product.id,
        basePrice: numBasePrice,
        discountPrice: numDiscountPrice,
      });

      // 2. Kombin Fiyatları Varsa Güncelle
      if (outfits.length > 0) {
        const updates = outfits.map((o: any) => {
          const rawVal = outfitPrices[o.outfitId];
          const finalPrice =
            rawVal !== "" && rawVal !== undefined && rawVal !== null
              ? Number(rawVal)
              : Number(o.currentOutfitPrice ?? o.price ?? 0);
          return {
            outfitId: o.outfitId,
            newPrice: finalPrice,
          };
        });

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

  // Ürün görsel URL'sini tüm olası alanlardan güvenle al
  const rawProductImg =
    product?.primaryImageUrl ||
    product?.mainImageUrl ||
    product?.imageUrl ||
    (product?.images && product.images.length > 0 ? product.images[0] : "") ||
    (product?.colors && product.colors.length > 0 ? product.colors[0]?.imageUrl : "") ||
    (initialProduct as any)?.primaryImageUrl ||
    (initialProduct as any)?.mainImageUrl ||
    "";

  const productImgUrl = rawProductImg ? getMinioUrl(rawProductImg) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Hızlı Fiyat & Kombin Yönetimi
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Ürünün satış fiyatını güncelleyin ve bağlı olduğu kombin setlerine anında yansıtın.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* SOL SÜTUN: ÜRÜN BİLGİSİ & YENİ FİYAT GİRİŞİ (5 Kolon) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Ürün Mini Kartı */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-18 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {productImgUrl ? (
                      <img
                        src={productImgUrl}
                        alt={product?.name || "Ürün"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product?.categoryName || "GİYİM"}
                      </span>
                      {product?.slug && (
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          SKU: {product.slug}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight truncate" title={product?.name}>
                      {product?.name || "Ürün"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {product?.categoryName || "Erkek Giyim"} {product?.productGroupName ? `· ${product.productGroupName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Mevcut Liste Fiyatı:</span>
                  <span className="font-bold text-slate-900">
                    {originalBasePrice.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              </div>

              {/* Fiyat Belirleme Alanı */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                {/* Yeni Satış Fiyatı */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                      <span>YENİ SATIŞ FİYATI</span>
                      <span className="text-rose-500">*</span>
                    </Label>
                    {priceDiff !== 0 && (
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          priceDiff > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {priceDiff > 0 ? (
                          <>↑ +{priceDiff.toLocaleString("tr-TR")} ₺ artış (+%{percentDiff})</>
                        ) : (
                          <>↓ {priceDiff.toLocaleString("tr-TR")} ₺ indirim (%{percentDiff})</>
                        )}
                      </Badge>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="h-11 text-base font-bold pr-8 bg-white border-slate-300 focus-visible:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                      ₺
                    </span>
                  </div>
                </div>

                {/* İndirimli Fiyat */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      İNDİRİMLİ FİYAT <span className="text-[10px] font-normal text-muted-foreground lowercase">(opsiyonel)</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-medium">Sepette geçerli</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="İndirim yoksa boş bırakın"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="h-10 text-sm font-medium pr-8 bg-white border-slate-200 focus-visible:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      ₺
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilgilendirme Notu */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-blue-900 text-xs flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  Ürün tekli satışta <strong className="text-blue-950">{parsedNewBasePrice.toLocaleString("tr-TR")} ₺</strong> olarak listelenecektir. Sağdaki listeden dahil olduğu kombinleri kontrol edebilirsiniz.
                </div>
              </div>
            </div>

            {/* SAĞ SÜTUN: DAHİL OLDUĞU KOMBİNLER & AKILLI FARK YANSITMA (7 Kolon) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Bölüm Başlığı & Sayaç */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    DAHİL OLDUĞU KOMBİNLER
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {outfits.length > 0 && (
                    <Badge className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-0.5 rounded-full">
                      {outfits.length} Kombin Mevcut
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Tekil veya toplu düzenleme yapabilirsiniz
                  </span>
                </div>
              </div>

              {/* Akıllı Fark Yansıtma Kartı (Hero Action Banner) */}
              {outfits.length > 0 && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-center justify-between gap-3 shadow-2xs transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-emerald-950 truncate">
                        Fiyat Farkını Tüm Kombinlere Yansıt ({priceDiff >= 0 ? `+${priceDiff.toLocaleString("tr-TR")}` : priceDiff.toLocaleString("tr-TR")} ₺)
                      </h4>
                      <p className="text-[11px] text-emerald-800 truncate">
                        {isDiffAppliedToAll
                          ? "Tüm set fiyatlarına ürün artış tutarı otomatik ilave edildi."
                          : "Tüm set fiyatlarına ürün fiyat farkını tek tıkla uygulayın."}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={isDiffAppliedToAll ? "outline" : "default"}
                    onClick={handleApplyDiffToAll}
                    className={`shrink-0 text-xs font-bold h-8 px-3 transition-all ${
                      isDiffAppliedToAll
                        ? "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isDiffAppliedToAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 stroke-[3]" />
                        Uygulandı ✓
                      </>
                    ) : (
                      "Farkı Yansıt"
                    )}
                  </Button>
                </div>
              )}

              {/* Kombin Kartları Listesi */}
              {isOutfitsLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground bg-white rounded-xl border border-dashed">
                  <Spinner className="w-5 h-5 text-amber-600 mr-2" />
                  <span className="text-xs font-medium">Kombin bilgileri kontrol ediliyor...</span>
                </div>
              ) : outfits.length > 0 ? (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {outfits.map((outfit: any) => {
                    const coverUrl = outfit.coverImageUrl || outfit.outfitCoverImageUrl
                      ? getMinioUrl(outfit.coverImageUrl || outfit.outfitCoverImageUrl)
                      : "";
                    const count = outfit.itemCount ?? outfit.totalPiecesCount ?? 0;
                    const origOutfitPrice = Number(outfit.currentOutfitPrice ?? outfit.price ?? 0);
                    
                    const currentValStr =
                      outfitPrices[outfit.outfitId] !== undefined
                        ? outfitPrices[outfit.outfitId]
                        : String(origOutfitPrice);

                    const currentNumVal =
                      currentValStr !== "" && !isNaN(Number(currentValStr))
                        ? Number(currentValStr)
                        : origOutfitPrice;

                    const singleDiff = currentNumVal - origOutfitPrice;

                    return (
                      <div
                        key={outfit.outfitId}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex items-center justify-between gap-3"
                      >
                        {/* Sol: Görsel ve Kombin Bilgisi */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-13 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
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
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]" title={outfit.outfitTitle}>
                                {outfit.outfitTitle}
                              </h4>
                              {count > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600">
                                  {count} Parça
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              Mevcut Set Fiyatı: <span className="font-semibold text-slate-700">{origOutfitPrice.toLocaleString("tr-TR")} ₺</span>
                            </p>
                          </div>
                        </div>

                        {/* Sağ: Fark Rozeti & Fiyat Inputu */}
                        <div className="flex items-center gap-3 shrink-0">
                          {singleDiff !== 0 && (
                            <div className="text-right hidden sm:block">
                              <span
                                className={`text-[11px] font-bold block ${
                                  singleDiff > 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {singleDiff > 0 ? `+${singleDiff.toLocaleString("tr-TR")} ₺ eklendi` : `${singleDiff.toLocaleString("tr-TR")} ₺ indirim`}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">Yeni Set Fiyatı</span>
                            </div>
                          )}

                          <div className="w-28 sm:w-32 relative">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={currentValStr}
                              onChange={(e) =>
                                setOutfitPrices({
                                  ...outfitPrices,
                                  [outfit.outfitId]: e.target.value,
                                })
                              }
                              className="h-10 text-sm font-bold pr-7 text-right bg-white border-slate-300 focus-visible:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              ₺
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl p-5 bg-white text-xs space-y-1">
                  <p className="font-semibold text-slate-700">Bu ürün henüz herhangi bir kombine dahil edilmemiş.</p>
                  <p className="text-[11px]">Ürün fiyatını tekil olarak güncelleyebilirsiniz.</p>
                </div>
              )}

              {/* Alt Hızlı Oran Araç Çubuğu */}
              {outfits.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-medium mr-1">Hızlı kombin oranı:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPercentage(10)}
                      className="h-7 px-2 text-[11px] font-semibold bg-white hover:bg-slate-50 border-slate-200"
                    >
                      +%10
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPercentage(15)}
                      className="h-7 px-2 text-[11px] font-semibold bg-white hover:bg-slate-50 border-slate-200"
                    >
                      +%15
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetOutfitPrices}
                      className="h-7 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Orijinal Fiyatlar
                    </Button>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Tekil kutulardan elle de düzenleyebilirsiniz
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t bg-white flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs h-9 px-4"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isProductLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-5 shadow-xs"
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
