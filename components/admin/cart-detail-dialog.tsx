"use client";

import { useEffect, useMemo } from "react";
import { Cart, CartItem } from "@/types/api.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useCartItems } from "@/hooks/useCarts";
import {
  ShoppingCart,
  Clock,
  User as UserIcon,
  Package,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
} from "lucide-react";
import { getMinioUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface CartDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: Cart | null;
}

export function CartDetailDialog({
  open,
  onOpenChange,
  cart,
}: CartDetailDialogProps) {
  const cartId = cart?.id;
  const { data: items, isLoading, isFetching, refetch } = useCartItems(cartId);

  // Dialog her açıldığında veritabanından en güncel kalemleri çek
  useEffect(() => {
    if (open && cartId) {
      refetch();
    }
  }, [open, cartId, refetch]);

  // Sepetteki ürünleri Kombin Paketleri ve Tekil Ürünler olarak ayır
  const { outfitBundles, regularItems, totalAmount } = useMemo(() => {
    const outfitMap = new Map<
      number,
      {
        outfitId: number;
        title: string;
        coverImageUrl?: string;
        price: number;
        quantity: number;
        items: CartItem[];
      }
    >();

    const regular: CartItem[] = [];

    (items || []).forEach((item) => {
      if (item.outfitId) {
        if (!outfitMap.has(item.outfitId)) {
          outfitMap.set(item.outfitId, {
            outfitId: item.outfitId,
            title: item.outfitTitle || `Kombin #${item.outfitId}`,
            coverImageUrl: item.outfitCoverImageUrl,
            price: item.outfitPrice
              ? Number(item.outfitPrice)
              : Number(item.price) || 0,
            quantity: item.quantity,
            items: [],
          });
        }
        outfitMap.get(item.outfitId)!.items.push(item);
      } else {
        regular.push(item);
      }
    });

    const bundles = Array.from(outfitMap.values());

    const total =
      bundles.reduce((acc, b) => acc + b.price * b.quantity, 0) +
      regular.reduce(
        (acc, item) => acc + (Number(item.price) || 0) * item.quantity,
        0
      );

    return {
      outfitBundles: bundles,
      regularItems: regular,
      totalAmount: total,
    };
  }, [items]);

  if (!cart) return null;

  const isExpired = cart.expiresAt
    ? new Date(cart.expiresAt) < new Date()
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Sepet Detayı #{cart.id}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Yenile
            </Button>
          </div>
          <DialogDescription>
            Kullanıcının sepetindeki kombin paketleri, parçaları, tekil ürünler ve toplam tutar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
          {/* Sepet Özet Kartı */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border bg-muted/40 text-xs">
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" /> Müşteri / Kullanıcı
              </div>
              <div className="font-semibold text-sm">
                {cart.userId
                  ? cart.userFullName || `Üye Müşteri (#${cart.userId})`
                  : "Misafir Ziyaretçi"}
              </div>
              {cart.userEmail && (
                <div className="text-[11px] text-muted-foreground">
                  {cart.userEmail}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Son Geçerlilik Tarihi
              </div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>
                  {cart.expiresAt
                    ? new Date(cart.expiresAt).toLocaleDateString("tr-TR")
                    : "-"}
                </span>
                <Badge
                  variant={isExpired ? "destructive" : "default"}
                  className="text-[10px] py-0 px-1.5"
                >
                  {isExpired ? "Süresi Doldu" : "Aktif"}
                </Badge>
              </div>
            </div>

            {/* Kombin Varlığı Bildirimi */}
            {outfitBundles.length > 0 && (
              <div className="col-span-2 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-emerald-900">
                    Kombin İçeriği:
                  </span>
                  <span className="font-medium text-emerald-800">
                    Bu sepette {outfitBundles.length} adet Kombin Paketi bulunmaktadır.
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-white">
                  {outfitBundles.map((b) => b.title).join(", ")}
                </Badge>
              </div>
            )}

            <div className="col-span-2 space-y-1 pt-1 border-t">
              <div className="text-muted-foreground">Sepet Token:</div>
              <code className="text-[11px] font-mono block truncate bg-background p-1.5 rounded border">
                {cart.cartToken}
              </code>
            </div>
          </div>

          {/* Sepet Kalemleri Başlığı & Toplam Tutar */}
          <div className="space-y-4">
            <div className="font-medium text-sm flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Sepet Kalemleri ({items?.length || 0} Parça)
              </span>
              {totalAmount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Toplam Sepet Tutarı:{" "}
                  <strong className="text-base font-bold text-foreground">
                    ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Spinner size="md" className="mr-2" />
                <span>Ürün bilgileri yükleniyor...</span>
              </div>
            ) : !items || items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-card">
                Bu sepette henüz ürün bulunmuyor.
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🌟 1. KOMBİN PAKETLERİ VE PARÇALARI 🌟 */}
                {outfitBundles.map((bundle) => {
                  const coverUrl = getMinioUrl(bundle.coverImageUrl);
                  const bundleTotal = bundle.price * bundle.quantity;

                  return (
                    <div
                      key={`bundle-${bundle.outfitId}`}
                      className="border-2 border-emerald-600/30 rounded-xl overflow-hidden bg-card shadow-xs"
                    >
                      {/* Kombin Paket Başlığı */}
                      <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-12 w-12 rounded-lg border border-emerald-200 bg-white shrink-0 overflow-hidden flex items-center justify-center">
                            {coverUrl ? (
                              <Image
                                src={coverUrl}
                                alt={bundle.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Sparkles className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] px-2 py-0.5">
                                <Sparkles className="h-3 w-3 mr-1 text-amber-300" />
                                Kombin Seti
                              </Badge>
                              <Badge variant="outline" className="text-[10px] text-emerald-900 border-emerald-300 bg-emerald-100/50">
                                {bundle.items.length} Parça
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-sm text-foreground mt-0.5">
                              {bundle.title}
                            </h4>
                          </div>
                        </div>

                        {/* Paket Adet ve Fiyatı */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="secondary" className="font-mono font-bold text-xs bg-white border border-emerald-200">
                              {bundle.quantity} Paket
                            </Badge>
                            <span className="font-bold text-base text-emerald-900">
                              ₺{bundleTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {bundle.quantity > 1 && (
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              (₺{bundle.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} / paket)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Kombini Oluşturan Parçalar */}
                      <div className="p-3 bg-white divide-y divide-gray-100">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                          Paket İçerisindeki Ürünler ({bundle.items.length})
                        </div>
                        {bundle.items.map((item) => {
                          const imgUrl = getMinioUrl(item.imageUrl);
                          const cleanName = (item.productName || "Ürün").replace(/\(.*?\)/g, "").trim();

                          return (
                            <div
                              key={`bundle-item-${item.id}`}
                              className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative h-11 w-11 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                  {imgUrl ? (
                                    <Image
                                      src={imgUrl}
                                      alt={cleanName}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>

                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-xs text-foreground truncate">
                                      {cleanName}
                                    </span>
                                    {item.productId && (
                                      <Link
                                        href={`/admin/products/${item.productId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Ürünü Yeni Sekmede İncele"
                                        className="text-muted-foreground hover:text-primary shrink-0"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    {item.colorName && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded border bg-background text-[10px]">
                                        {item.colorHexCode && (
                                          <span
                                            className="w-2 h-2 rounded-full border shrink-0"
                                            style={{ backgroundColor: item.colorHexCode }}
                                          />
                                        )}
                                        {item.colorName}
                                      </span>
                                    )}

                                    {item.sizeName && (
                                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 bg-gray-50">
                                        Beden: {item.sizeName}
                                      </Badge>
                                    )}

                                    <Badge variant="secondary" className="text-[10px] py-0 px-1 text-emerald-800 bg-emerald-50 border-emerald-200">
                                      Kombin Parçası
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-semibold text-gray-700">
                                  {item.quantity} Adet
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* 🌟 2. TEKİL / BAĞIMSIZ STANDART ÜRÜNLER 🌟 */}
                {regularItems.length > 0 && (
                  <div className="border rounded-xl divide-y bg-card overflow-hidden">
                    {outfitBundles.length > 0 && (
                      <div className="p-2.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tekil Standart Ürünler ({regularItems.length})
                      </div>
                    )}
                    {regularItems.map((item) => {
                      const imgUrl = getMinioUrl(item.imageUrl);
                      const price = Number(item.price) || 0;
                      const lineTotal = price * item.quantity;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative h-14 w-14 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={item.productName || "Ürün"}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate text-foreground">
                                  {item.productName || `Ürün Varyantı #${item.productVariantId}`}
                                </span>
                                {item.productId && (
                                  <Link
                                    href={`/admin/products/${item.productId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ürünü Yeni Sekmede İncele"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                {item.colorName && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[11px]">
                                    {item.colorHexCode && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border shrink-0"
                                        style={{ backgroundColor: item.colorHexCode }}
                                      />
                                    )}
                                    {item.colorName}
                                  </span>
                                )}

                                {item.sizeName && (
                                  <Badge variant="secondary" className="text-[11px] font-normal px-1.5 py-0">
                                    Beden: {item.sizeName}
                                  </Badge>
                                )}

                                {item.sku && (
                                  <span className="font-mono text-[10px] text-muted-foreground/80">
                                    SKU: {item.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <Badge variant="outline" className="font-mono font-bold text-xs">
                              {item.quantity} Adet
                            </Badge>
                            {price > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {item.quantity > 1 && (
                                  <span className="text-[10px] block">
                                    ₺{price.toFixed(2)} / adet
                                  </span>
                                )}
                                <span className="font-semibold text-sm text-foreground block">
                                  ₺{lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
