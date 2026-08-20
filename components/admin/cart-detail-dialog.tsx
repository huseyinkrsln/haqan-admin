"use client";

import { useEffect } from "react";
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
import { ShoppingCart, Clock, User as UserIcon, Package, ExternalLink, RefreshCw } from "lucide-react";
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

  if (!cart) return null;

  const isExpired = cart.expiresAt ? new Date(cart.expiresAt) < new Date() : false;

  const totalAmount = items?.reduce((acc, item) => {
    const p = Number(item.price) || 0;
    return acc + p * item.quantity;
  }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
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
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
          <DialogDescription>
            Kullanıcının sepetinde bekleyen ürünler, varyant özellikleri ve sepet tutarı.
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
                {cart.userId ? (cart.userFullName || `Üye Müşteri (#${cart.userId})`) : "Misafir Ziyaretçi"}
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
                <span>{cart.expiresAt ? new Date(cart.expiresAt).toLocaleDateString("tr-TR") : "-"}</span>
                <Badge variant={isExpired ? "destructive" : "default"} className="text-[10px] py-0 px-1.5">
                  {isExpired ? "Süresi Doldu" : "Aktif"}
                </Badge>
              </div>
            </div>
            <div className="col-span-2 space-y-1 pt-1 border-t">
              <div className="text-muted-foreground">Sepet Token:</div>
              <code className="text-[11px] font-mono block truncate bg-background p-1.5 rounded border">
                {cart.cartToken}
              </code>
            </div>
          </div>

          {/* Sepetteki Ürünler */}
          <div className="space-y-2.5">
            <div className="font-medium text-sm flex items-center justify-between">
              <span>Sepetteki Ürünler ({items?.length || 0})</span>
              {totalAmount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Toplam Tutar: <strong className="text-sm text-foreground">₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
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
              <div className="border rounded-lg divide-y bg-card overflow-hidden">
                {items.map((item) => {
                  const imgUrl = getMinioUrl(item.imageUrl);
                  const price = Number(item.price) || 0;
                  const lineTotal = price * item.quantity;

                  return (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      {/* Sol: Görsel ve Ürün Bilgisi */}
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
                                href={`/admin/products`}
                                title="Ürünü İncele"
                                className="text-muted-foreground hover:text-primary shrink-0"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>

                          {/* Renk, Beden, SKU Etiketleri */}
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

                      {/* Sağ: Adet ve Fiyat Bilgisi */}
                      <div className="text-right shrink-0 space-y-1">
                        <Badge variant="outline" className="font-mono font-bold text-xs">
                          {item.quantity} Adet
                        </Badge>
                        {price > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {item.quantity > 1 && (
                              <span className="text-[10px] block">₺{price.toFixed(2)} / adet</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
