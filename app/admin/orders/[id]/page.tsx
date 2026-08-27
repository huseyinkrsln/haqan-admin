"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ArrowLeft,
  RotateCw,
  Save,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useOrder, useOrderItems, useUpdateOrder } from "@/hooks/useOrders";
import { useShippingCarriers } from "@/hooks/useShippingCarriers";
import { OrderStatusEnum } from "@/types/api.types";
import { getMinioUrl } from "@/lib/utils";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Package },
  shipped: { label: "Kargolandı", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = Number(resolvedParams.id);

  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const { data: orderData, isLoading: isOrderLoading, refetch: refetchOrder, isFetching } = useOrder(orderId);
  const { data: orderItems, isLoading: isItemsLoading } = useOrderItems(orderId);
  const { data: carriers } = useShippingCarriers();
  const updateMutation = useUpdateOrder();

  const order = (orderData as any)?.data || orderData;

  const [status, setStatus] = useState<string>("");
  const [carrierId, setCarrierId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");

  useEffect(() => {
    if (order) {
      setStatus(order.orderStatus ? order.orderStatus.toLowerCase() : "pending");
      setCarrierId(order.shippingCarrierId ? String(order.shippingCarrierId) : "none");
      setTrackingNumber(order.trackingNumber || "");
    }
  }, [order]);

  const handleSave = () => {
    if (!order) return;

    // PascalCase status
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    updateMutation.mutate(
      {
        ...order,
        orderStatus: capitalizedStatus,
        shippingCarrierId: carrierId === "none" ? undefined : Number(carrierId),
        trackingNumber: trackingNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Sipariş başarıyla güncellendi.");
          refetchOrder();
        },
        onError: () => {
          toast.error("Sipariş güncellenirken hata oluştu.");
        },
      }
    );
  };

  const currentStatusKey = status || "pending";
  const currentStatusConfig = statusConfig[currentStatusKey] || statusConfig.pending;
  const StatusIcon = currentStatusConfig.icon;

  if (isOrderLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Spinner size="lg" className="mb-4" />
        <p className="font-medium text-sm">Sipariş detayları yükleniyor...</p>
      </div>
    );
  }

  if (!order || !order.id) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin/orders" />}>Siparişler</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Bulunamadı</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <XCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Sipariş Bulunamadı</h3>
          <p className="text-sm text-muted-foreground mb-6">
            #{orderId} numaralı sipariş kaydı veritabanında bulunamadı veya silinmiş olabilir.
          </p>
          <Button render={<Link href="/admin/orders" />} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Siparişler Listesine Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Top Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin/orders" />}>Siparişler</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sipariş #{order.orderNumber || order.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2.5">
          <Button render={<Link href="/admin/orders" />} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Geri
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrder()}
            disabled={isFetching}
            title="Yenile"
          >
            <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="ml-1.5 hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* ─── Header Info Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                Sipariş #{order.orderNumber || order.id}
              </h2>
              <Badge variant="outline" className={`gap-1.5 py-1 px-3 ${currentStatusConfig.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {currentStatusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </span>
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Toplam Tutar</p>
          <p className="text-2xl font-black text-gray-900">
            ₺{(order.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column (2 Cols): Products Table & Items ────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Sipariş Edilen Ürünler ({orderItems?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isItemsLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : !orderItems || orderItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Bu siparişe ait ürün bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/75">
                      <TableRow>
                        <TableHead className="w-16">Ürün</TableHead>
                        <TableHead>Ürün Bilgisi</TableHead>
                        <TableHead className="text-center">Adet</TableHead>
                        <TableHead className="text-right">Birim Fiyat</TableHead>
                        <TableHead className="text-right">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => {
                        const img = item.productImageUrl ? getMinioUrl(item.productImageUrl) : "/placeholder.png";
                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50/60">
                            <TableCell>
                              <div className="relative w-12 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                <Image
                                  src={img}
                                  alt={item.productName || "Ürün"}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-gray-900 text-sm">
                                {item.productName || `Ürün #${item.productId}`}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {item.colorName && <span>Renk: <strong>{item.colorName}</strong></span>}
                                {item.sizeName && <span>Beden: <strong>{item.sizeName}</strong></span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-sm">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              ₺{(item.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-gray-900">
                              ₺{((item.price || 0) * (item.quantity || 1)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adres Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teslimat Adresi */}
            <Card className="rounded-2xl border-gray-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Teslimat Adresi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2 text-gray-700">
                <p className="font-bold text-gray-900 text-sm">{order.shippingFullName || "-"}</p>
                {order.shippingPhoneNumber && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{order.shippingPhoneNumber}</span>
                  </p>
                )}
                <p className="leading-relaxed">
                  {order.shippingAddressLine1}
                  {order.shippingAddressLine2 ? ` ${order.shippingAddressLine2}` : ""}
                </p>
                <p className="font-semibold text-gray-900">
                  {order.shippingDistrict ? `${order.shippingDistrict} / ` : ""}
                  {order.shippingCity || "-"}, {order.shippingCountry || "Türkiye"}
                </p>
              </CardContent>
            </Card>

            {/* Fatura Adresi */}
            <Card className="rounded-2xl border-gray-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Fatura Adresi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2 text-gray-700">
                <p className="font-bold text-gray-900 text-sm">{order.billingFullName || order.shippingFullName || "-"}</p>
                {order.billingPhoneNumber && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{order.billingPhoneNumber}</span>
                  </p>
                )}
                <p className="leading-relaxed">
                  {order.billingAddressLine1 || order.shippingAddressLine1}
                  {order.billingAddressLine2 ? ` ${order.billingAddressLine2}` : ""}
                </p>
                <p className="font-semibold text-gray-900">
                  {order.billingDistrict ? `${order.billingDistrict} / ` : ""}
                  {order.billingCity || order.shippingCity || "-"}, {order.billingCountry || "Türkiye"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Right Column (1 Col): Status Update & Shipping Management ───────── */}
        <div className="space-y-6">
          {/* Sipariş Durumu & Kargo Yönetimi */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span>Sipariş & Kargo Yönetimi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sipariş Durumu</Label>
                <Select value={status} onValueChange={setStatus} disabled={role === "VIEWER" || updateMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="processing">Hazırlanıyor</SelectItem>
                    <SelectItem value="shipped">Kargolandı</SelectItem>
                    <SelectItem value="delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kargo Firması</Label>
                <Select value={carrierId} onValueChange={setCarrierId} disabled={role === "VIEWER" || updateMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kargo firması seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçilmedi</SelectItem>
                    {carriers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kargo Takip Numarası</Label>
                <Input
                  placeholder="Örn: 1234567890"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={role === "VIEWER" || updateMutation.isPending}
                />
              </div>

              {role !== "VIEWER" && (
                <Button
                  className="w-full mt-2"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Müşteri Bilgileri */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Müşteri Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-muted-foreground">Kullanıcı ID:</span>
                <span className="font-semibold text-gray-900">#{order.userId || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-muted-foreground">Ad Soyad:</span>
                <span className="font-semibold text-gray-900">{order.shippingFullName || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-muted-foreground">Telefon:</span>
                <span className="font-semibold text-gray-900">{order.shippingPhoneNumber || "-"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tahmini Teslimat:</span>
                <span className="font-semibold text-gray-900">
                  {order.estimatedDeliveryDate
                    ? new Date(order.estimatedDeliveryDate).toLocaleDateString("tr-TR")
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
