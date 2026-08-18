"use client";

import { useProductById } from "@/hooks/useProducts";
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
import { Package, Tag, Layers, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { getMinioUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
}

export function ProductDetailModal({
  open,
  onOpenChange,
  productId,
}: ProductDetailModalProps) {
  const { data: rawProduct, isLoading } = useProductById(productId ?? 0);
  const product = (rawProduct as any)?.data || rawProduct;

  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  if (!productId) return null;

  // Collect all images from productColors
  const allImages = product?.productColors?.flatMap((pc: any) => pc.productImages || []) || [];
  const activeImage = selectedImg || (allImages.length > 0 ? allImages[0]?.imageUrl : null);
  const imgUrl = getMinioUrl(activeImage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              {product?.name || `Ürün #${productId}`}
            </DialogTitle>
          </div>
          <DialogDescription>
            Ürün detayları, varyantları, fiyat ve galeri bilgileri.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Spinner size="lg" className="mb-3" />
            <p>Ürün bilgileri yükleniyor...</p>
          </div>
        ) : !product ? (
          <div className="text-center py-12 text-muted-foreground">
            Ürün bulunamadı veya silinmiş olabilir.
          </div>
        ) : (
          <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
            {/* Üst Kısım: Görsel + Temel Bilgiler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sol: Fotoğraf Galerisi */}
              <div className="space-y-2">
                <div className="relative aspect-square w-full rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={product.name || "Ürün"}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {allImages.map((img: any, idx: number) => {
                      const thumb = getMinioUrl(img.imageUrl);
                      const isSelected = (img.imageUrl === activeImage);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImg(img.imageUrl)}
                          className={`relative h-12 w-12 rounded-md border shrink-0 overflow-hidden transition-all ${
                            isSelected ? "ring-2 ring-primary border-primary" : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt="küçük resim"
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sağ: Bilgi Kartları */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Fiyat Bilgisi
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      ₺{product.basePrice ? Number(product.basePrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0.00"}
                    </span>
                    {product.discountPrice && (
                      <span className="text-sm line-through text-muted-foreground">
                        ₺{Number(product.discountPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground">Ürün Kodu / ID:</span>
                    <span className="font-semibold block truncate">#{product.id}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground">Kategori ID:</span>
                    <span className="font-semibold block truncate">#{product.categoryId || "-"}</span>
                  </div>
                </div>

                {/* Rozetler */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.isFeatured && (
                    <Badge variant="default" className="text-[11px] gap-1">
                      <Sparkles className="h-3 w-3" /> Öne Çıkan
                    </Badge>
                  )}
                  {product.isBestSeller && (
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Çok Satan
                    </Badge>
                  )}
                  {product.isNewArrival && (
                    <Badge variant="outline" className="text-[11px] gap-1">
                      Yeni Sezon
                    </Badge>
                  )}
                </div>

                {product.description && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-semibold text-muted-foreground">Açıklama:</span>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Alt Kısım: Renk ve Beden Varyantları */}
            {product.productColors && product.productColors.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Mevcut Renk ve Varyantlar
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.productColors.map((pc: any) => (
                    <div key={pc.id} className="p-2.5 rounded-md border bg-muted/20 space-y-1.5 text-xs">
                      <div className="font-semibold flex items-center justify-between">
                        <span>Renk ID: #{pc.colorId}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {pc.productVariants?.length || 0} Beden Varyantı
                        </span>
                      </div>
                      {pc.productVariants && pc.productVariants.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {pc.productVariants.map((v: any) => (
                            <Badge key={v.id} variant="outline" className="text-[10px] font-mono">
                              Beden #{v.sizeId} (Stok: {v.stockQuantity})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button
            render={
              <Link href={`/admin/products?search=${encodeURIComponent(product?.name || productId)}`} />
            }
            className="gap-1.5 text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ürün Yönetiminde Aç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
