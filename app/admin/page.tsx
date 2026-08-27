"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders, useOrderCounts } from "@/hooks/useOrders";
import { useCoupons } from "@/hooks/useCoupons";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
import {
  useComplaintSuggestions,
  useComplaintSuggestionStats,
  useUpdateComplaintSuggestionStatus,
} from "@/hooks/useComplaintSuggestions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import { toast } from "sonner";
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
  MessageSquareWarning,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  ExternalLink,
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
import { Order, ComplaintSuggestion } from "@/types/api.types";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  shipped: { label: "Kargolandı", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  delivered: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

function getFeedbackTypeInfo(type: any, typeName?: string) {
  const val = String(type ?? "").toLowerCase();
  const name = String(typeName ?? "").toLowerCase();

  if (val === "1" || val === "complaint" || name.includes("şikayet")) {
    return {
      label: "Şikayet",
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      icon: AlertCircle,
    };
  }
  if (val === "2" || val === "suggestion" || name.includes("öneri")) {
    return {
      label: "Öneri",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: Lightbulb,
    };
  }
  if (val === "3" || val === "request" || name.includes("talep")) {
    return {
      label: "Talep",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: HelpCircle,
    };
  }
  return {
    label: "Diğer",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    icon: MessageSquare,
  };
}

function getFeedbackStatusInfo(status: any, statusName?: string) {
  const val = String(status ?? "").toLowerCase();
  const name = String(statusName ?? "").toLowerCase();

  if (val === "1" || val === "pending" || name.includes("bekle")) {
    return {
      label: "Beklemede",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };
  }
  if (val === "2" || val === "inreview" || val === "review" || name.includes("incele")) {
    return {
      label: "İnceleniyor",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    };
  }
  if (val === "3" || val === "resolved" || name.includes("çözül") || name.includes("yanıt")) {
    return {
      label: "Çözüldü",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
  }
  if (val === "4" || val === "rejected" || name.includes("red") || name.includes("kapat")) {
    return {
      label: "Reddedildi",
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    };
  }
  return {
    label: "Bilinmiyor",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };
}

export default function DashboardPage() {
  const { data: productsData, isLoading: productsLoading } = useProducts({ page: 1, take: 1 });
  const { query: usersQuery } = useUsers(1, 1);
  const { data: ordersData, isLoading: ordersLoading } = useOrders(1, 50);
  const { data: orderCountsData, isLoading: countsLoading } = useOrderCounts();
  const { data: couponsData } = useCoupons();

  // Şikayet ve Öneri (Geri Bildirim) Verileri
  const { data: feedbackData, isLoading: feedbackLoading } = useComplaintSuggestions({ page: 1, take: 5 });
  const { data: feedbackStats, isLoading: feedbackStatsLoading } = useComplaintSuggestionStats();
  const updateStatusMutation = useUpdateComplaintSuggestionStatus();

  // Modal Durumları
  const [selectedFeedback, setSelectedFeedback] = useState<ComplaintSuggestion | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [feedbackStatusInput, setFeedbackStatusInput] = useState<number>(1);
  const [adminNoteInput, setAdminNoteInput] = useState<string>("");

  const handleOpenFeedbackModal = (item: ComplaintSuggestion) => {
    setSelectedFeedback(item);
    setFeedbackStatusInput(Number(item.processStatus) || 1);
    setAdminNoteInput(item.adminNote || "");
  };

  const handleSaveFeedbackStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedFeedback.id,
        processStatus: feedbackStatusInput,
        adminNote: adminNoteInput.trim() || undefined,
      });
      toast.success("Bildirim durumu başarıyla güncellendi.");
      setSelectedFeedback(null);
    } catch (err: any) {
      toast.error(err.response?.data?.Message || "Durum güncellenirken bir hata oluştu.");
    }
  };

  const usersData = usersQuery.data;
  const usersLoading = usersQuery.isLoading;

  const orders: Order[] = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data || [];
  const coupons = Array.isArray(couponsData) ? couponsData : (couponsData as any)?.data || [];

  const feedbacks: ComplaintSuggestion[] = Array.isArray(feedbackData?.items)
    ? feedbackData.items
    : (Array.isArray(feedbackData) ? feedbackData : (feedbackData as any)?.data || []);

  const totalProducts = (productsData as any)?.totalRecords ?? (productsData as any)?.TotalRecords ?? (Array.isArray(productsData) ? productsData.length : 0);
  const totalUsers = (usersData as any)?.totalRecords ?? (usersData as any)?.TotalRecords ?? (Array.isArray(usersData) ? usersData.length : (usersData as any)?.data?.length ?? 0);
  const totalOrders = orderCountsData?.total ?? orders.length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orderCountsData?.pending ?? 0;
  const processingOrders = orderCountsData?.processing ?? 0;

  const recentOrders = [...orders].slice(0, 5);

  const pendingFeedbackCount = feedbackStats?.pendingCount ?? (feedbacks.filter(f => Number(f.processStatus) === 1).length);
  const totalFeedbackCount = feedbackStats?.totalCount ?? feedbacks.length;

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
          <p className="text-sm text-muted-foreground">Mağazanızın güncel durumunu, bildirimlerini ve metriklerini takip edin.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/complaint-suggestions">
            <Button variant="outline" size="sm" className="gap-1.5 relative">
              <MessageSquareWarning className="h-4 w-4 text-amber-500" />
              Geri Bildirimler
              {pendingFeedbackCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingFeedbackCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShoppingBag className="h-4 w-4 text-primary" /> Siparişler
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button size="sm" className="gap-1.5">
              <Package className="h-4 w-4" /> Ürünler
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Link href="/admin/complaint-suggestions" className="block group">
          <Card className="relative overflow-hidden hover:border-amber-500/40 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-amber-600 transition-colors">
                Şikayet & Öneri
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <MessageSquareWarning className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {feedbackStatsLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {totalFeedbackCount}
                    {pendingFeedbackCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">
                        {pendingFeedbackCount} yeni
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    {pendingFeedbackCount > 0 ? `${pendingFeedbackCount} bildirim yanıt bekliyor` : "Tüm bildirimler incelendi"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
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
                            <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
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
              href="/admin/complaint-suggestions"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <MessageSquareWarning className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Şikayet & Öneriler</div>
                  <div className="text-xs text-muted-foreground">{pendingFeedbackCount} bekleyen bildirim</div>
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
                  <div className="text-xs text-muted-foreground">{coupons.filter(c => c.isActive !== false).length} aktif kupon</div>
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

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                Son Müşteri Geri Bildirimleri
              </CardTitle>
              <CardDescription>
                Müşterilerden gelen şikayet, öneri ve destek talepleri
              </CardDescription>
            </div>
            <Link href="/admin/complaint-suggestions">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                Tümünü İncele <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-medium text-foreground">Kayıtlı müşteri bildirimi bulunmuyor.</p>
                <p className="text-xs">Yeni bir şikayet veya öneri geldiğinde burada listelenecektir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.slice(0, 4).map((item) => {
                  const typeCfg = getFeedbackTypeInfo(item.type, item.typeName);
                  const statusCfg = getFeedbackStatusInfo(item.processStatus, item.processStatusName);
                  const Icon = typeCfg.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenFeedbackModal(item)}
                      className="p-3.5 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-background transition-colors">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.subject || "Konu Belirtilmemiş"}
                            </span>
                            <Badge variant="outline" className={`text-[10px] py-0 px-2 font-medium border ${typeCfg.color}`}>
                              {typeCfg.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] py-0 px-2 font-medium border ${statusCfg.color}`}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.message}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{item.fullName || item.email || "Anonim Kullanıcı"}</span>
                            {item.createdDate && (
                              <>
                                <span>•</span>
                                <span>{new Date(item.createdDate).toLocaleDateString("tr-TR")}</span>
                              </>
                            )}
                            {item.orderId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-primary">Sipariş #{item.orderId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 shrink-0 self-end sm:self-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFeedbackModal(item);
                        }}
                      >
                        İncele <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Geri Bildirim Dağılımı</CardTitle>
            <CardDescription>Müşteri bildirimlerinin durum analizi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbackStatsLoading ? (
              <div className="py-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Beklemede</span>
                  </div>
                  <span className="font-semibold">{feedbackStats?.pendingCount ?? pendingFeedbackCount}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">İnceleniyor</span>
                  </div>
                  <span className="font-semibold">{feedbackStats?.inReviewCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Çözüldü</span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {feedbackStats?.resolvedCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-muted-foreground">Reddedildi / Kapandı</span>
                  </div>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {feedbackStats?.rejectedCount ?? 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t bg-muted/20 rounded-b-lg">
            <Link href="/admin/complaint-suggestions">
              <Button variant="default" className="w-full text-xs h-8 gap-1.5">
                <MessageSquareWarning className="h-3.5 w-3.5" /> Tüm Bildirimleri Yönet
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ─── MODAL: Şikayet & Öneri İnceleme ve Durum Güncelleme ─── */}
      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => {
          if (!open && !updateStatusMutation.isPending) {
            setSelectedFeedback(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFeedback && (
            <form onSubmit={handleSaveFeedbackStatus} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                      getFeedbackTypeInfo(selectedFeedback.type, selectedFeedback.typeName).color
                    }`}
                  >
                    {getFeedbackTypeInfo(selectedFeedback.type, selectedFeedback.typeName).label}
                  </span>
                  <span className="text-xs text-muted-foreground">ID: #{selectedFeedback.id}</span>
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedFeedback.subject}
                </DialogTitle>
                <DialogDescription>
                  {selectedFeedback.createdDate
                    ? new Date(selectedFeedback.createdDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/50 rounded-xl p-4 border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Gönderen:</span>
                  <p className="font-semibold text-foreground">{selectedFeedback.fullName || "Anonim"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">E-posta:</span>
                  <p className="font-semibold text-foreground">{selectedFeedback.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Telefon:</span>
                  <p className="font-semibold text-foreground">{selectedFeedback.phoneNumber || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">İlişkili Sipariş:</span>
                  <p className="font-semibold text-foreground">
                    {selectedFeedback.orderId ? (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(selectedFeedback.orderId!)}
                        className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Sipariş detayını incele"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Sipariş #{selectedFeedback.orderId}</span>
                      </button>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Kullanıcı Mesajı</Label>
                <div className="p-4 rounded-xl bg-muted/40 border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-process-status" className="text-xs font-semibold">
                    İşlem Durumu *
                  </Label>
                  <select
                    id="feedback-process-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={String(feedbackStatusInput)}
                    onChange={(e) => setFeedbackStatusInput(Number(e.target.value))}
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="1">Beklemede (İşleme Alınmadı)</option>
                    <option value="2">İnceleniyor (İşlem Yapılıyor)</option>
                    <option value="3">Çözüldü / Yanıtlandı</option>
                    <option value="4">Reddedildi / Kapatıldı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback-admin-note" className="text-xs font-semibold">
                    Yönetici Notu (Opsiyonel)
                  </Label>
                  <Textarea
                    id="feedback-admin-note"
                    rows={3}
                    placeholder="Bu taleple ilgili yapılan işlem veya dahili çözüm notunuzu yazabilirsiniz..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    disabled={updateStatusMutation.isPending}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFeedback(null)}
                  disabled={updateStatusMutation.isPending}
                >
                  Kapat
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="gap-2"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Kaydet & Güncelle</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Sipariş İnceleme Modalı */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onOpenChange={(open) => !open && setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
