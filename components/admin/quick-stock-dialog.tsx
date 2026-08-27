"use client";

import { useState, useMemo } from "react";
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
import { useProductById } from "@/hooks/useProducts";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { toast } from "sonner";
import {
  Boxes,
  Sliders,
  CheckCircle2,
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Save,
} from "lucide-react";

interface QuickStockDialogProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickStockDialog({
  productId,
  open,
  onOpenChange,
}: QuickStockDialogProps) {
  const { data: product, isLoading, refetch } = useProductById(productId || 0);
  const createMovementMutation = useCreateStockMovement();

  // Genel Hareket Bilgileri
  const [movementType, setMovementType] = useState<string>("In");
  const [referenceType, setReferenceType] = useState<string>("SupplierReceipt");
  const [referenceId, setReferenceId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Her bir varyant için kullanıcının girdiği miktar (variantId -> number | "")
  const [variantInputs, setVariantInputs] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ürüne ait tüm varyantları topla
  const rawProduct = (product as any)?.data || product;
  const directVariants = rawProduct?.variants || rawProduct?.Variants || [];

  const variants = useMemo(() => {
    if (directVariants.length > 0) {
      return directVariants.map((v: any) => ({
        id: v.variantId ?? v.VariantId ?? v.id,
        colorId: v.colorId ?? v.ColorId,
        colorName: v.colorName ?? v.ColorName,
        colorHexCode: v.colorHexCode ?? v.ColorHexCode,
        sizeId: v.sizeId ?? v.SizeId,
        sizeName: v.sizeName ?? v.SizeName ?? `Beden #${v.sizeId ?? v.SizeId}`,
        stockQuantity: v.stockQuantity ?? v.StockQuantity ?? 0,
        sku: v.sku ?? v.Sku,
        barcode: v.barcode ?? v.Barcode,
      }));
    }
    return (rawProduct?.productColors || rawProduct?.ProductColors || []).flatMap((pc: any) =>
      (pc.productVariants || pc.ProductVariants || []).map((v: any) => ({
        id: v.id ?? v.Id ?? v.variantId,
        colorId: pc.colorId ?? pc.ColorId,
        colorName: pc.color?.name ?? pc.Color?.Name ?? pc.colorName,
        colorHexCode: pc.color?.hexCode ?? pc.Color?.HexCode,
        sizeName: v.size?.name ?? v.Size?.Name ?? v.sizeName ?? `Beden #${v.sizeId}`,
        stockQuantity: v.stockQuantity ?? v.StockQuantity ?? 0,
        sku: v.sku ?? v.Sku,
        barcode: v.barcode ?? v.Barcode,
      }))
    );
  }, [rawProduct, directVariants]);

  const handleInputChange = (variantId: number, val: string) => {
    setVariantInputs((prev) => ({
      ...prev,
      [variantId]: val,
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Değer girilmiş olan varyantları filtrele
    const entriesToSave = Object.entries(variantInputs)
      .map(([vIdStr, valStr]) => ({
        variantId: Number(vIdStr),
        val: valStr === "" ? NaN : Number(valStr),
      }))
      .filter((item) => !isNaN(item.val) && item.val > 0);

    if (entriesToSave.length === 0) {
      toast.error("Lütfen en az bir varyant için miktar girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Tüm varyant hareketlerini kaydet
      const promises = entriesToSave.map((entry) => {
        const finalQty = movementType === "Adjustment" ? 0 : Math.abs(entry.val);
        const finalCurrentStock = movementType === "Adjustment" ? entry.val : undefined;

        return createMovementMutation.mutateAsync({
          productVariantId: entry.variantId,
          movementType,
          quantity: finalQty,
          currentStock: finalCurrentStock,
          referenceType: referenceType || undefined,
          referenceId: referenceId.trim() || undefined,
          note: note.trim() || undefined,
        });
      });

      await Promise.all(promises);

      toast.success(`${entriesToSave.length} adet varyantın stok hareketi başarıyla kaydedildi!`);
      setVariantInputs({});
      setReferenceId("");
      setNote("");
      refetch();
      onOpenChange(false);
    } catch (err) {
      toast.error("Stok hareketleri kaydedilirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalProductStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);

  // Toplam eklenecek/etkilenecek miktar hesapla
  const totalChangeCount = Object.values(variantInputs).reduce((acc: number, cur: string) => {
    const num = Number(cur);
    return !isNaN(num) && num > 0 ? acc + num : acc;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <PackagePlus className="h-5 w-5 text-primary" />
            <DialogTitle>Stok Yönetimi & Toplu Stok Girişi</DialogTitle>
          </div>
          <DialogDescription>
            Her bir varyant için hareket miktarını girip tek seferde toplu olarak kaydedebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Spinner size="lg" className="mb-3" />
            <p className="text-sm">Ürün varyantları yükleniyor...</p>
          </div>
        ) : !product ? (
          <div className="py-8 text-center text-muted-foreground">Ürün bilgisi bulunamadı.</div>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4 pt-1">
            {/* Ürün Özet Kartı */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-foreground">{rawProduct.name || rawProduct.Name}</p>
                <p className="text-xs text-muted-foreground font-mono">{rawProduct.slug || rawProduct.Slug}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Toplam Mevcut Stok</div>
                <div className="font-mono font-bold text-base text-primary">
                  {totalProductStock} Adet
                </div>
              </div>
            </div>

            {/* Ortak Hareket Parametreleri */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">İşlem Türü</Label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="In">Stok Girişi (Mal Kabul / Üretim)</option>
                    <option value="Out">Stok Çıkışı (Manuel / Sevkiyat)</option>
                    <option value="Adjustment">Sayım Düzeltmesi (Miktarı Eşitle)</option>
                    <option value="Return">İade Girişi (Müşteri İadesi)</option>
                    <option value="Waste">Fire / Hasar Çıkışı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Referans Türü</Label>
                  <select
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="SupplierReceipt">Tedarikçi İrsaliyesi</option>
                    <option value="Audit">Depo Sayımı</option>
                    <option value="OrderReturn">Sipariş İadesi</option>
                    <option value="Waste">Fire / Hasarlı Ürün</option>
                    <option value="Manual">Manuel İşlem</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">İrsaliye / Ref No</Label>
                  <Input
                    placeholder="Örn: IRS-2026-0045"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Açıklama & Not (Opsiyonel)</Label>
                <Input
                  placeholder="Örn: Yeni parti sevkiyatı depoya kabul edildi."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Yan Yana Varyant Tablosu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Varyantlar ve Miktar Girişi ({variants.length})
                </Label>
                {totalChangeCount > 0 && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Girilen Toplam Miktar: +{totalChangeCount} Adet
                  </span>
                )}
              </div>

              {variants.length === 0 ? (
                <div className="p-6 border rounded-md text-xs text-muted-foreground text-center">
                  Bu ürüne ait henüz renk / beden varyantı tanımlanmamış.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden divide-y divide-border/60">
                  <div className="grid grid-cols-12 gap-2 p-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground">
                    <div className="col-span-4">Varyant (Renk / Beden)</div>
                    <div className="col-span-3 text-center">Mevcut Stok</div>
                    <div className="col-span-3 text-center">
                      {movementType === "Adjustment" ? "Yeni Net Stok" : "İşlem Miktarı"}
                    </div>
                    <div className="col-span-2 text-right">Yeni Durum</div>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto divide-y divide-border/40">
                    {variants.map((v: any) => {
                      const inputVal = variantInputs[v.id] || "";
                      const inputNum = Number(inputVal);
                      const currentStock = v.stockQuantity || 0;

                      // Yeni önizleme hesabı
                      let nextStock = currentStock;
                      if (!isNaN(inputNum) && inputVal !== "") {
                        if (movementType === "In" || movementType === "Return") {
                          nextStock = currentStock + Math.abs(inputNum);
                        } else if (movementType === "Out" || movementType === "Waste") {
                          nextStock = Math.max(0, currentStock - Math.abs(inputNum));
                        } else if (movementType === "Adjustment") {
                          nextStock = Math.max(0, inputNum);
                        }
                      }

                      const hasChange = inputVal !== "" && !isNaN(inputNum) && inputNum > 0;

                      return (
                        <div
                          key={v.id}
                          className={`grid grid-cols-12 gap-2 p-2.5 items-center transition-colors ${
                            hasChange ? "bg-primary/5" : "hover:bg-muted/20"
                          }`}
                        >
                          {/* Varyant Bilgisi */}
                          <div className="col-span-4 space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              {v.colorName && (
                                <span className="inline-flex items-center gap-1">
                                  {v.colorHexCode && (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: v.colorHexCode }}
                                    />
                                  )}
                                  <span className="truncate">{v.colorName}</span>
                                </span>
                              )}
                              <span>•</span>
                              <span className="font-bold">{v.sizeName}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground truncate">
                              {v.barcode ? `Barkod: ${v.barcode}` : v.sku ? `SKU: ${v.sku}` : `#${v.id}`}
                            </div>
                          </div>

                          {/* Mevcut Stok */}
                          <div className="col-span-3 text-center">
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs font-bold py-0.5 px-2 ${
                                currentStock === 0
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                  : currentStock < 10
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              }`}
                            >
                              {currentStock} Adet
                            </Badge>
                          </div>

                          {/* Değer Girişi */}
                          <div className="col-span-3 px-1">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={inputVal}
                              onChange={(e) => handleInputChange(v.id, e.target.value)}
                              className="h-8 text-center text-xs font-mono font-bold"
                            />
                          </div>

                          {/* Önizleme */}
                          <div className="col-span-2 text-right">
                            {hasChange ? (
                              <span className="font-mono text-xs font-bold text-primary">
                                → {nextStock}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground">
                                {currentStock}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || variants.length === 0}
                className="gap-1.5 font-semibold text-xs min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" /> Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Toplu Kaydet
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
