"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Order, ShippingCarrier } from "@/types/api.types";
import { useUpdateOrder, useOrderItems, useOrder } from "@/hooks/useOrders";
import { useShippingCarriers } from "@/hooks/useShippingCarriers";
import { getMinioUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  CreditCard,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  orderId?: number | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Package },
  shipped: { label: "Kargolandı", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: XCircle },
};

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargolandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

export function OrderDetailDialog({
  open,
  onOpenChange,
  order: initialOrder,
  orderId,
}: OrderDetailDialogProps) {
  const effectiveOrderId = initialOrder?.id || orderId || undefined;
  const { data: fetchedOrderData, isLoading: isOrderFetching } = useOrder(
    open && !initialOrder && effectiveOrderId ? effectiveOrderId : undefined
  );

  const order: Order | null =
    initialOrder || (fetchedOrderData as any)?.data || fetchedOrderData || null;

  const updateOrderMutation = useUpdateOrder();
  const { data: carriersData } = useShippingCarriers();
  const { data: itemsData, isLoading: itemsLoading } = useOrderItems(
    open && order?.id ? order.id : undefined
  );

  const [orderStatus, setOrderStatus] = useState<string>("Pending");
  const [shippingCarrierId, setShippingCarrierId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");

  const carriers: ShippingCarrier[] = Array.isArray(carriersData)
    ? carriersData
    : (carriersData as any)?.data || [];

  const items = Array.isArray(itemsData) ? itemsData : (itemsData as any)?.data || [];

  useEffect(() => {
    if (order) {
      setOrderStatus(order.orderStatus || "Pending");
      setShippingCarrierId(order.shippingCarrierId ? String(order.shippingCarrierId) : "");
      setTrackingNumber(order.trackingNumber || "");
    }
  }, [order, open]);

  if (!open) return null;

  if (isOrderFetching && !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Sipariş detayları yükleniyor...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  const currentStatusKey = (order.orderStatus || "pending").toLowerCase();
  const currentStatusObj = statusConfig[currentStatusKey] || {
    label: order.orderStatus,
    color: "bg-muted text-muted-foreground",
    icon: Package,
  };
  const StatusIcon = currentStatusObj.icon;

  const getStatusLabel = (val?: string) => {
    if (!val) return "Durum Seçin";
    return statusLabels[val.toLowerCase()] || val;
  };

  const getCarrierName = (idStr?: string) => {
    if (!idStr || idStr === "" || idStr === "0") return "Seçilmedi";
    const found = carriers.find((c) => String(c.id) === String(idStr));
    return found ? found.name : `Kargo #${idStr}`;
  };

  const handleSave = () => {
    // İş kuralı / Validasyon kontrolleri
    if (orderStatus === "Shipped") {
      if (!shippingCarrierId || shippingCarrierId === "0" || shippingCarrierId === "") {
        toast.warning("Kargolanan sipariş için lütfen bir Kargo Firması seçin.");
        return;
      }
      if (!trackingNumber.trim()) {
        toast.warning("Kargolanan sipariş için lütfen Kargo Takip Numarasını girin.");
        return;
      }
    }

    const updatedDto: Order = {
      ...order,
      orderStatus: orderStatus,
      shippingCarrierId: shippingCarrierId ? Number(shippingCarrierId) : order.shippingCarrierId,
      trackingNumber: trackingNumber.trim() || undefined,
    };

    updateOrderMutation.mutate(updatedDto, {
      onSuccess: () => {
        toast.success("Sipariş başarıyla güncellendi.");
        onOpenChange(false);
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        const msg = typeof errorData === "string" 
          ? errorData 
          : errorData?.message || "Sipariş güncellenirken bir hata oluştu.";
        toast.error(msg);
      },
    });
  };

  const selectedCarrier = carriers.find((c) => String(c.id) === shippingCarrierId);
  const trackingUrl = selectedCarrier?.trackingUrlTemplate && trackingNumber
    ? selectedCarrier.trackingUrlTemplate.replace("{0}", trackingNumber)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 gap-6">
        {/* Üst Başlık & Durum */}
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Sipariş #{order.orderNumber || order.id}
                </DialogTitle>
                <Badge variant="outline" className={`text-xs px-2.5 py-0.5 gap-1.5 font-medium ${currentStatusObj.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {currentStatusObj.label}
                </Badge>
              </div>
              <DialogDescription className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleString("tr-TR")
                  : "Tarih bilgisi yok"}
              </DialogDescription>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground">Sipariş Toplamı</div>
              <div className="text-xl font-bold text-foreground">
                ₺{(order.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Gövde İçerik */}
        <div className="space-y-6">
          {/* Sipariş Durumu & Kargo Yönetimi Kartı */}
          <Card className="bg-card border-primary/20 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Durum ve Kargo Takip Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status-select" className="text-xs font-medium">Sipariş Durumu</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger id="status-select" className="w-full bg-background">
                    <SelectValue placeholder="Durum Seçin">
                      {getStatusLabel(orderStatus)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Beklemede</SelectItem>
                    <SelectItem value="Processing">Hazırlanıyor</SelectItem>
                    <SelectItem value="Shipped">Kargolandı</SelectItem>
                    <SelectItem value="Delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="Cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carrier-select" className="text-xs font-medium">
                  Kargo Firması {orderStatus === "Shipped" && <span className="text-destructive">*</span>}
                </Label>
                <Select value={shippingCarrierId} onValueChange={setShippingCarrierId}>
                  <SelectTrigger id="carrier-select" className="w-full bg-background">
                    <SelectValue placeholder="Kargo Firması Seçin">
                      {getCarrierName(shippingCarrierId)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seçilmedi</SelectItem>
                    {carriers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tracking-input" className="text-xs font-medium">
                    Kargo Takip No {orderStatus === "Shipped" && <span className="text-destructive">*</span>}
                  </Label>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      Kargo Takip <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Input
                  id="tracking-input"
                  placeholder="Örn: 1234567890"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Adres Bilgileri: 2 Sütun */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teslimat Adresi */}
            <Card className="shadow-xs">
              <CardHeader className="py-3 px-4 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="h-4 w-4" />
                  Teslimat Adresi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{order.shippingFullName || "Belirtilmemiş"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{order.shippingPhoneNumber || "-"}</span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground leading-relaxed">
                  <p className="text-foreground font-medium">{order.shippingAddressLine1}</p>
                  {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                  <p className="mt-1 font-semibold text-primary">
                    {[order.shippingDistrict, order.shippingCity, order.shippingCountry]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fatura Adresi */}
            <Card className="shadow-xs">
              <CardHeader className="py-3 px-4 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <CreditCard className="h-4 w-4" />
                  Fatura Adresi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{order.billingFullName || order.shippingFullName || "Belirtilmemiş"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{order.billingPhoneNumber || order.shippingPhoneNumber || "-"}</span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground leading-relaxed">
                  <p className="text-foreground font-medium">
                    {order.billingAddressLine1 || order.shippingAddressLine1}
                  </p>
                  {(order.billingAddressLine2 || order.shippingAddressLine2) && (
                    <p>{order.billingAddressLine2 || order.shippingAddressLine2}</p>
                  )}
                  <p className="mt-1 font-semibold text-primary">
                    {[
                      order.billingDistrict || order.shippingDistrict,
                      order.billingCity || order.shippingCity,
                      order.billingCountry || order.shippingCountry,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sipariş Edilen Ürün Kalemleri */}
          <Card className="shadow-xs">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Sipariş Kalemleri
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {items.length} Kalem
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Spinner size="sm" className="mr-2" /> Kalemler yükleniyor...
                </div>
              ) : items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Ürün / Varyant</TableHead>
                      <TableHead className="text-center">Adet</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right pr-6">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const imgUrl = getMinioUrl(item.imageUrl);
                      const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 rounded-md border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                {imgUrl ? (
                                  <Image
                                    src={imgUrl}
                                    alt={item.productName || "Ürün"}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-sm truncate text-foreground">
                                    {item.productName || `Ürün Varyantı #${item.productVariantId}`}
                                  </span>
                                  {item.productId && (
                                    <Link
                                      href={`/admin/products/${item.productId}`}
                                      target="_blank"
                                      title="Ürünü İncele"
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
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-medium">
                              {item.quantity} Adet
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            ₺{(item.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm pr-6">
                            ₺{lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Bu siparişe bağlı kalem bulunamadı. Toplam tutar: ₺
                  {(order.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Butonlar */}
        <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button onClick={handleSave} disabled={updateOrderMutation.isPending} className="gap-2">
            {updateOrderMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Kaydediliyor...
              </>
            ) : (
              "Değişiklikleri Kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
