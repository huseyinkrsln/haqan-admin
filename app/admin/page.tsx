"use client";

import Link from "next/link";
import { useOrders, useOrderCounts } from "@/hooks/useOrders";
import { useCoupons } from "@/hooks/useCoupons";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Package,
  Users,
  ShoppingBag,
  DollarSign,
  TicketPercent,
  Clock,
  ArrowRight,
  Truck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/types/api.types";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  shipped: { label: "Kargolandı", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  delivered: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

export default function DashboardPage() {
  const { data: productsData, isLoading: productsLoading } = useProducts({ page: 1, take: 1 });
  const { query: usersQuery } = useUsers(1, 1);
  const { data: ordersData, isLoading: ordersLoading } = useOrders(1, 50);
  const { data: orderCountsData, isLoading: countsLoading } = useOrderCounts();
  const { data: couponsData } = useCoupons();

  const usersData = usersQuery.data;
  const usersLoading = usersQuery.isLoading;

  const orders: Order[] = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data || [];
  const coupons = Array.isArray(couponsData) ? couponsData : (couponsData as any)?.data || [];

  const totalProducts = (productsData as any)?.totalRecords ?? (productsData as any)?.TotalRecords ?? (Array.isArray(productsData) ? productsData.length : 0);
  const totalUsers = (usersData as any)?.totalRecords ?? (usersData as any)?.TotalRecords ?? (Array.isArray(usersData) ? usersData.length : (usersData as any)?.data?.length ?? 0);
  const totalOrders = orderCountsData?.total ?? orders.length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orderCountsData?.pending ?? 0;
  const processingOrders = orderCountsData?.processing ?? 0;

  const recentOrders = [...orders].slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Yönetim Özeti</h1>
          <p className="text-sm text-muted-foreground">Mağazanızın güncel durumunu ve metriklerini takip edin.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShoppingBag className="h-4 w-4 text-primary" /> Siparişleri Gör
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button size="sm" className="gap-1.5">
              <Package className="h-4 w-4" /> Ürün Yönetimi
            </Button>
          </Link>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Toplam Ciro */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Kayıtlı tüm siparişlerin toplamı
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Toplam Sipariş */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingOrders} adet beklemede
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Toplam Ürün */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">Sistemdeki aktif ürün adedi</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Aktif Kuponlar */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kuponlar</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TicketPercent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.filter(c => c.isActive !== false).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tanımlı indirim kampanyaları</p>
          </CardContent>
        </Card>
      </div>

      {/* Detay Tabloları ve Hızlı İşlemler */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Son Siparişler Tablosu (5 Kolon) */}
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Son Gelen Siparişler
              </CardTitle>
              <CardDescription>Mağazadan verilen son 5 sipariş</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Henüz sipariş bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => {
                      const dateVal = order.orderDate || (order as any).OrderDate || order.createdDate;
                      const customer = order.shippingFullName || order.billingFullName || order.customerName || (order.userId ? `Kullanıcı #${order.userId}` : "Misafir");
                      const statusKey = (order.orderStatus || "").toLowerCase();
                      const statusItem = statusConfig[statusKey] || {
                        label: order.orderStatus || "Bilinmiyor",
                        color: "bg-muted text-muted-foreground",
                      };

                      return (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-xs font-medium">
                            <Link href="/admin/orders" className="hover:underline text-primary">
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {customer}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dateVal ? new Date(dateVal).toLocaleDateString("tr-TR") : "-"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(order.totalAmount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium border ${statusItem.color}`}
                            >
                              {statusItem.label}
                            </Badge>
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

        {/* Hızlı İşlemler & Kısayollar (2-3 Kolon) */}
        <Card className="md:col-span-3 lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Hızlı İşlemler</CardTitle>
            <CardDescription>Sık kullanılan yönetim paneli sayfaları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Sipariş Yönetimi</div>
                  <div className="text-xs text-muted-foreground">{pendingOrders} bekleyen sipariş</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>

            <Link
              href="/admin/coupons"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <TicketPercent className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Kupon & Promosyon</div>
                  <div className="text-xs text-muted-foreground">Yeni indirim kodu oluştur</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>

            <Link
              href="/admin/sliders"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Vitrin & Bannerlar</div>
                  <div className="text-xs text-muted-foreground">Ana sayfa sliderlarını düzenle</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </CardContent>
          <Link href="/admin/users" className="block hover:opacity-80 transition">
            <div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground rounded-b-lg flex items-center justify-between">
              <span>Kayıtlı Kullanıcı Sayısı: <span className="font-semibold text-foreground">{usersLoading ? "..." : totalUsers}</span></span>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
