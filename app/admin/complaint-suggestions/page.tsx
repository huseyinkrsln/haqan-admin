"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Eye,
  RotateCw,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import {
  useComplaintSuggestions,
  useComplaintSuggestionStats,
  useUpdateComplaintSuggestionStatus,
  useDeleteComplaintSuggestion,
} from "@/hooks/useComplaintSuggestions";
import {
  ComplaintSuggestion,
  FeedbackType,
  FeedbackStatus,
} from "@/types/api.types";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFeedbackTypeInfo(type: any, typeName?: string) {
  const val = String(type ?? "").toLowerCase();
  const name = String(typeName ?? "").toLowerCase();

  if (val === "1" || val === "complaint" || name.includes("şikayet")) {
    return {
      label: "Şikayet",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: AlertCircle,
    };
  }
  if (val === "2" || val === "suggestion" || name.includes("öneri")) {
    return {
      label: "Öneri",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Lightbulb,
    };
  }
  if (val === "3" || val === "request" || name.includes("talep")) {
    return {
      label: "Talep",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: HelpCircle,
    };
  }
  return {
    label: "Diğer",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: MessageSquare,
  };
}

export function parseFeedbackStatus(status: any, statusName?: string): FeedbackStatus {
  if (typeof status === "number" && !isNaN(status) && status >= 1 && status <= 4) {
    return status as FeedbackStatus;
  }
  const val = String(status ?? "").toLowerCase();
  const name = String(statusName ?? "").toLowerCase();

  if (val === "1" || val === "pending" || name.includes("bekle")) return FeedbackStatus.Pending;
  if (val === "2" || val === "inreview" || val === "review" || name.includes("incele")) return FeedbackStatus.InReview;
  if (val === "3" || val === "resolved" || name.includes("çözül") || name.includes("yanıt")) return FeedbackStatus.Resolved;
  if (val === "4" || val === "rejected" || name.includes("red") || name.includes("kapat")) return FeedbackStatus.Rejected;
  return FeedbackStatus.Pending;
}

export function getFeedbackStatusInfo(status: any, statusName?: string) {
  const parsed = parseFeedbackStatus(status, statusName);

  switch (parsed) {
    case FeedbackStatus.Pending:
      return {
        label: "Beklemede",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
      };
    case FeedbackStatus.InReview:
      return {
        label: "İnceleniyor",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: RotateCw,
      };
    case FeedbackStatus.Resolved:
      return {
        label: "Çözüldü",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case FeedbackStatus.Rejected:
      return {
        label: "Reddedildi",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
      };
    default:
      return {
        label: "Bilinmiyor",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: HelpCircle,
      };
  }
}

export default function ComplaintSuggestionsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [selectedType, setSelectedType] = useState<FeedbackType | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Search Debounce (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Arama yapıldığında 1. sayfaya dön
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Dedicated Stats Query (Bağımsız endpoint)
  const { 
    data: statsData, 
    isFetching: isStatsFetching, 
    refetch: refetchStats 
  } = useComplaintSuggestionStats();

  const stats = statsData || {
    totalCount: 0,
    pendingCount: 0,
    inReviewCount: 0,
    resolvedCount: 0,
    rejectedCount: 0,
    complaintCount: 0,
    suggestionCount: 0,
    requestCount: 0,
    otherCount: 0,
  };

  // Paginated List Query
  const {
    data: responseData,
    isLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useComplaintSuggestions({
    page,
    take,
    search: debouncedSearch,
    type: selectedType === "ALL" ? undefined : selectedType,
    processStatus: selectedStatus === "ALL" ? undefined : selectedStatus,
  });

  const items = responseData?.items || [];
  const totalRecords = responseData?.totalRecords || 0;
  const totalPages = responseData?.totalPages || 1;

  const updateStatusMutation = useUpdateComplaintSuggestionStatus();
  const deleteMutation = useDeleteComplaintSuggestion();

  // Modal State
  const [detailItem, setDetailItem] = useState<ComplaintSuggestion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<FeedbackStatus>(FeedbackStatus.Pending);
  const [adminNoteInput, setAdminNoteInput] = useState("");

  // Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<ComplaintSuggestion | null>(null);

  // Open Detail / Update Modal
  const handleOpenDetail = (item: ComplaintSuggestion) => {
    setDetailItem(item);
    setNewStatus(parseFeedbackStatus(item.processStatus, item.processStatusName));
    setAdminNoteInput(item.adminNote || "");
    setIsDetailOpen(true);
  };

  // Order Detail Modal State (Siparişler sayfasındaki modalı burada açar)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleOpenOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  // Submit Status / Note Update
  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;

    updateStatusMutation.mutate(
      {
        id: detailItem.id,
        processStatus: Number(newStatus),
        adminNote: adminNoteInput.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Bildirim durumu ve notu başarıyla güncellendi.");
          setIsDetailOpen(false);
          setDetailItem(null);
        },
        onError: () => {
          toast.error("Durum güncellenirken bir hata oluştu.");
        },
      }
    );
  };

  // Delete Action
  const handleDelete = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        toast.success("Kayıt başarıyla silindi.");
        setItemToDelete(null);
        if (detailItem?.id === itemToDelete.id) {
          setIsDetailOpen(false);
        }
      },
      onError: () => {
        toast.error("Kayıt silinirken bir hata oluştu.");
        setItemToDelete(null);
      },
    });
  };

  const handleTypeTabChange = (t: FeedbackType | "ALL") => {
    setSelectedType(t);
    setPage(1);
  };

  const handleStatusTabChange = (s: FeedbackStatus | "ALL") => {
    setSelectedStatus(s);
    setPage(1);
  };

  const isRefreshing = isListFetching || isStatsFetching;

  const handleRefresh = () => {
    refetchList();
    refetchStats();
  };

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Actions Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Şikayet & Öneri Talepleri</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Yenile"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="ml-1.5 hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* ─── Statistics Cards (Bağımsız Stats Endpoint'inden Gelen Sayılar) ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Toplam Bildirim</p>
            <h4 className="text-2xl font-bold mt-1 text-gray-900">{stats.totalCount}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.complaintCount} Şikayet, {stats.suggestionCount} Öneri
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Bekleyenler</p>
            <h4 className="text-2xl font-bold mt-1 text-amber-800">{stats.pendingCount}</h4>
            <p className="text-[11px] text-amber-600/90 mt-0.5">İşlem bekleyen geri bildirim</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">İncelenenler</p>
            <h4 className="text-2xl font-bold mt-1 text-blue-800">{stats.inReviewCount}</h4>
            <p className="text-[11px] text-blue-600/90 mt-0.5">İnceleme sürecinde olan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <RotateCw className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Çözülenler</p>
            <h4 className="text-2xl font-bold mt-1 text-emerald-800">{stats.resolvedCount}</h4>
            <p className="text-[11px] text-emerald-600/90 mt-0.5">Başarıyla sonuçlanan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Reddedilenler</p>
            <h4 className="text-2xl font-bold mt-1 text-rose-800">{stats.rejectedCount}</h4>
            <p className="text-[11px] text-rose-600/90 mt-0.5">Kapatılan / reddedilen</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ─── Filters & Search Bar ────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tip Sekmeleri */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: "ALL", label: "Tüm Türler" },
              { key: FeedbackType.Complaint, label: "Şikayetler", icon: AlertCircle },
              { key: FeedbackType.Suggestion, label: "Öneriler", icon: Lightbulb },
              { key: FeedbackType.Request, label: "Talepler", icon: HelpCircle },
              { key: FeedbackType.Other, label: "Diğer", icon: MessageSquare },
            ].map((tab) => {
              const active = selectedType === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={String(tab.key)}
                  type="button"
                  onClick={() => handleTypeTabChange(tab.key as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-gray-900 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-gray-900"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Durum Sekmeleri */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: "ALL", label: "Tüm Durumlar" },
              { key: FeedbackStatus.Pending, label: "Beklemede" },
              { key: FeedbackStatus.InReview, label: "İnceleniyor" },
              { key: FeedbackStatus.Resolved, label: "Çözüldü" },
              { key: FeedbackStatus.Rejected, label: "Reddedildi" },
            ].map((tab) => {
              const active = selectedStatus === tab.key;
              return (
                <button
                  key={String(tab.key)}
                  type="button"
                  onClick={() => handleStatusTabChange(tab.key as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-gray-900 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-gray-900"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Backend Arama Çubuğu */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Konu, ad soyad, e-posta, telefon, mesaj veya sipariş no ile ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 w-full bg-white"
          />
        </div>
      </div>

      {/* ─── Complaints / Suggestions Table ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white rounded-2xl border border-gray-200">
          <Spinner size="lg" className="mb-4" />
          <p className="font-medium text-sm">Geri bildirimler yükleniyor...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {debouncedSearch ? "Arama Sonucu Bulunamadı" : "Kayıt Bulunmuyor"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {debouncedSearch
              ? `"${debouncedSearch}" aramasına uygun şikayet veya öneri kaydı bulunamadı.`
              : "Seçili filtrelere uygun henüz bir şikayet, öneri veya talep kaydı bulunmamaktadır."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Tür</th>
                  <th className="px-5 py-3.5">Durum</th>
                  <th className="px-5 py-3.5">Konu & Mesaj</th>
                  <th className="px-5 py-3.5">Gönderen</th>
                  <th className="px-5 py-3.5">Sipariş</th>
                  <th className="px-5 py-3.5">Tarih</th>
                  <th className="px-5 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const typeInfo = getFeedbackTypeInfo(item.type, item.typeName);
                  const statusInfo = getFeedbackStatusInfo(item.processStatus, item.processStatusName);
                  const TypeIcon = typeInfo.icon;
                  const StatusIcon = statusInfo.icon;

                  const formattedDate = item.createdDate
                    ? new Date(item.createdDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* Tür Rozeti */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${typeInfo.color}`}
                        >
                          <TypeIcon className="h-3.5 w-3.5" />
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Durum Rozeti */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Konu & Mesaj Özeti */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-gray-900 truncate">
                          {item.subject}
                        </div>
                        <div className="text-xs text-muted-foreground truncate line-clamp-1 mt-0.5">
                          {item.message}
                        </div>
                        {item.adminNote && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <FileText className="h-3 w-3" />
                            <span>Not: {item.adminNote}</span>
                          </div>
                        )}
                      </td>

                      {/* Gönderen */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs">
                          {item.fullName || "Anonim Ziyaretçi"}
                        </div>
                        {item.email && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {item.phoneNumber && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span>{item.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Sipariş No (Tıklandığında Siparişler Sayfasındaki İnceleme Modalı Açılır) */}
                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {item.orderId ? (
                          <button
                            type="button"
                            onClick={() => handleOpenOrder(item.orderId!)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 transition-colors cursor-pointer"
                            title="Sipariş detayını incele"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>Sipariş #{item.orderId}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Tarih */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* İşlemler */}
                      <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-medium text-gray-700 hover:text-primary hover:bg-primary/10"
                            onClick={() => handleOpenDetail(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> İncele
                          </Button>
                          {role !== "VIEWER" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              onClick={() => setItemToDelete(item)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Sayfalama (Pagination) Alt Çubuğu ──────────────────────────────── */}
          <div className="px-5 py-3.5 bg-gray-50/75 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Toplam <strong>{totalRecords}</strong> kayıttan <strong>{(page - 1) * take + 1}</strong> - <strong>{Math.min(page * take, totalRecords)}</strong> arası gösteriliyor</span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <span>Sayfa Başına:</span>
                <select
                  value={take}
                  onChange={(e) => {
                    setTake(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 self-center sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isListFetching}
                  title="Önceki Sayfa"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 px-2 font-medium text-gray-800">
                  <span>Sayfa {page} / {totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isListFetching}
                  title="Sonraki Sayfa"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: İnceleme & Durum / Not Güncelleme ─────────────────────────── */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={updateStatusMutation.isPending ? undefined : setIsDetailOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailItem && (
            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                      getFeedbackTypeInfo(detailItem.type, detailItem.typeName).color
                    }`}
                  >
                    {getFeedbackTypeInfo(detailItem.type, detailItem.typeName).label}
                  </span>
                  <span className="text-xs text-muted-foreground">ID: #{detailItem.id}</span>
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {detailItem.subject}
                </DialogTitle>
                <DialogDescription>
                  {detailItem.createdDate
                    ? new Date(detailItem.createdDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </DialogDescription>
              </DialogHeader>

              {/* Kullanıcı / Gönderen Bilgileri */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Gönderen:</span>
                  <p className="font-semibold text-gray-900">{detailItem.fullName || "Anonim"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">E-posta:</span>
                  <p className="font-semibold text-gray-900">{detailItem.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Telefon:</span>
                  <p className="font-semibold text-gray-900">{detailItem.phoneNumber || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">İlişkili Sipariş:</span>
                  <p className="font-semibold text-gray-900">
                    {detailItem.orderId ? (
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(detailItem.orderId!)}
                        className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Sipariş detayını incele"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Sipariş #{detailItem.orderId}</span>
                      </button>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              {/* Mesaj İçeriği */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Kullanıcı Mesajı</Label>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {detailItem.message}
                </div>
              </div>

              {/* Durum & Not Güncelleme Alanı */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="process-status" className="text-xs font-semibold">
                    İşlem Durumu *
                  </Label>
                  <select
                    id="process-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={String(newStatus)}
                    onChange={(e) => setNewStatus(Number(e.target.value) as FeedbackStatus)}
                    disabled={updateStatusMutation.isPending || role === "VIEWER"}
                  >
                    <option value={String(FeedbackStatus.Pending)}>Beklemede (İşleme Alınmadı)</option>
                    <option value={String(FeedbackStatus.InReview)}>İnceleniyor (İşlem Yapılıyor)</option>
                    <option value={String(FeedbackStatus.Resolved)}>Çözüldü / Yanıtlandı</option>
                    <option value={String(FeedbackStatus.Rejected)}>Reddedildi / Kapatıldı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-note" className="text-xs font-semibold">
                    Admin / Yönetici Notu (Opsiyonel)
                  </Label>
                  <Textarea
                    id="admin-note"
                    rows={3}
                    placeholder="Bu taleple ilgili yapılan işlem, çözüm veya dahili notunuzu buraya yazabilirsiniz..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    disabled={updateStatusMutation.isPending || role === "VIEWER"}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Bu not yöneticiler için takip ve çözüm kaydı oluşturur.
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
                {role !== "VIEWER" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setItemToDelete(detailItem);
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Bu Bildirimi Sil
                  </Button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Kapat
                  </Button>
                  {role !== "VIEWER" && (
                    <Button type="submit" disabled={updateStatusMutation.isPending}>
                      {updateStatusMutation.isPending ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Durumu Güncelle
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ALERT: Silme Onayı ──────────────────────────────────────────────── */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setItemToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu geri bildirimi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{itemToDelete?.subject}&quot; konulu bildirim kaydı sistemden kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── MODAL: Sipariş Detayı (Siparişler sayfasındaki modalın aynısı) ─── */}
      <OrderDetailDialog
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        orderId={selectedOrderId}
      />
    </div>
  );
}
