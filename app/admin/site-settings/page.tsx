"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Plus,
  Search,
  RotateCw,
  Save,
  Trash2,
  Edit2,
  Globe,
  Phone,
  Share2,
  ShoppingBag,
  Bell,
  Layers,
  Sparkles,
  Check,
  HelpCircle,
  ExternalLink,
  Info,
  LayoutGrid,
  Table as TableIcon,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { axiosInstance } from "@/lib/axios";
import { getMinioUrl } from "@/lib/utils";

import {
  useSiteSettings,
  useCreateSiteSetting,
  useUpdateSiteSetting,
  useBulkUpdateSiteSettings,
  useDeleteSiteSetting,
} from "@/hooks/useSiteSettings";
import { SiteSetting, SiteSettingBulkItemDto } from "@/types/api.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// ─── Group Definitions ───────────────────────────────────────────────────────

interface SettingGroupMeta {
  key: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const SETTING_GROUPS: SettingGroupMeta[] = [
  {
    key: "General",
    label: "Genel & SEO",
    description: "Site başlığı, slogan, logo ve arama motoru meta ayarları",
    icon: Globe,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  {
    key: "Contact",
    label: "İletişim & Adres",
    description: "Telefon, WhatsApp, e-posta, çalışma saatleri ve harita konumu",
    icon: Phone,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  {
    key: "Social",
    label: "Sosyal Medya",
    description: "Instagram, Facebook, X, TikTok ve diğer sosyal bağlantılar",
    icon: Share2,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  {
    key: "Commerce",
    label: "E-Ticaret & Kargo",
    description: "Ücretsiz kargo alt limiti, sabit kargo ücreti ve para birimi",
    icon: ShoppingBag,
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  {
    key: "Banner",
    label: "Duyuru & Bildirimler",
    description: "En üst bant duyuru metni ve mağaza bilgilendirme mesajları",
    icon: Bell,
    color: "bg-rose-500/10 text-rose-600 border-rose-200",
  },
];

// Varsayılan / Başlangıç Ayar Şablonları (Preset)
const DEFAULT_PRESETS: SiteSettingBulkItemDto[] = [
  // Genel
  { settingKey: "SiteTitle", settingValue: "HAQAN Wear", groupKey: "General", description: "Web sitesinin ana başlığı (Title)" },
  { settingKey: "SiteSlogan", settingValue: "Sessiz Özgüven", groupKey: "General", description: "Site sloganı veya alt başlığı" },
  // Logo ve Favicon alanları geçici olarak devre dışı bırakıldı (sistem sabit marka varlıklarını kullanmaktadır)
  // { settingKey: "LogoUrl", settingValue: "", groupKey: "General", description: "Site ana logosunun URL bağlantısı" },
  // { settingKey: "FaviconUrl", settingValue: "", groupKey: "General", description: "Tarayıcı sekme ikonu (Favicon)" },
  { settingKey: "MetaDescription", settingValue: "Zamansız tasarımlar ve premium kumaşlarla giyimde yeni standartlar. Takım elbise, gömlek, pantolon ve aksesuar koleksiyonları.", groupKey: "General", description: "Google arama motoru açıklaması" },
  { settingKey: "MetaKeywords", settingValue: "erkek giyim, moda, takım elbise, gömlek, pantolon, haqan wear", groupKey: "General", description: "SEO anahtar kelimeleri (virgülle ayrılmış)" },

  // İletişim
  { settingKey: "PhoneNumber", settingValue: "+90 555 111 22 33", groupKey: "Contact", description: "Müşteri hizmetleri telefon numarası" },
  { settingKey: "WhatsAppNumber", settingValue: "+90 555 111 22 33", groupKey: "Contact", description: "WhatsApp sipariş & destek hattı" },
  { settingKey: "WhatsAppDefaultMessage", settingValue: "Merhaba, web sitenizden ürünler hakkında bilgi almak istiyorum.", groupKey: "Contact", description: "WhatsApp butonuna tıklandığında otomatik doldurulan hazır karşılama mesajı" },
  { settingKey: "EmailAddress", settingValue: "destek@hakanwear.com", groupKey: "Contact", description: "Resmi destek e-posta adresi" },
  { settingKey: "StoreAddress", settingValue: "Bağdat Caddesi No:123 Kadıköy / İstanbul", groupKey: "Contact", description: "Merkez mağaza / ofis açık adresi" },
  { settingKey: "WorkingHours", settingValue: "Hafta içi 09:00 - 18:00 | Cumartesi 10:00 - 16:00", groupKey: "Contact", description: "Müşteri hizmetleri çalışma saatleri" },
  { settingKey: "GoogleMapsUrl", settingValue: "", groupKey: "Contact", description: "Google Maps mağaza harita linki veya embed iframe" },

  // Sosyal Medya
  { settingKey: "InstagramUrl", settingValue: "https://instagram.com/hakanwear", groupKey: "Social", description: "Instagram profil bağlantısı" },
  { settingKey: "FacebookUrl", settingValue: "https://facebook.com/hakanwear", groupKey: "Social", description: "Facebook sayfa bağlantısı" },
  { settingKey: "TwitterUrl", settingValue: "https://x.com/hakanwear", groupKey: "Social", description: "X / Twitter hesap bağlantısı" },
  { settingKey: "TikTokUrl", settingValue: "https://tiktok.com/@hakanwear", groupKey: "Social", description: "TikTok profil bağlantısı" },
  { settingKey: "YouTubeUrl", settingValue: "https://youtube.com/@hakanwear", groupKey: "Social", description: "YouTube kanal bağlantısı" },

  // E-Ticaret & Kargo
  { settingKey: "FreeShippingThreshold", settingValue: "1500", groupKey: "Commerce", description: "Ücretsiz kargo uygulanması için minimum sepet tutarı (₺)" },
  { settingKey: "FlatShippingRate", settingValue: "79.90", groupKey: "Commerce", description: "Standart sabit kargo gönderim ücreti (₺)" },
  { settingKey: "TaxRatePercent", settingValue: "10", groupKey: "Commerce", description: "Fiyatlara dahil standart KDV oranı (%)" },

  // Banner & Duyuru
  { settingKey: "AnnouncementIsActive", settingValue: "true", groupKey: "Banner", description: "En üst bilgi/duyuru barı aktif mi? (true / false)" },
  { settingKey: "AnnouncementText", settingValue: "Tüm siparişlerde 1.500 TL üzeri Ücretsiz Kargo | Yeni Sezon Koleksiyonu Keşfedin", groupKey: "Banner", description: "En üst ince duyuru bandında kayan metin" },
  { settingKey: "MaintenanceMode", settingValue: "false", groupKey: "Banner", description: "Site bakım modu aktif mi? (true / false)" },
  { settingKey: "PopupIsActive", settingValue: "false", groupKey: "Banner", description: "Açılış duyuru / kampanya / bayram pop-up'ı aktif mi? (true / false)" },
  { settingKey: "PopupTitle", settingValue: "Özel Sezon Fırsatı", groupKey: "Banner", description: "Açılış pop-up modalı başlığı (Milli bayram kutlaması veya kampanya başlığı)" },
  { settingKey: "PopupDescription", settingValue: "Yeni sezon seçili ürünlerde geçerli özel indirimleri keşfedin.", groupKey: "Banner", description: "Açılış pop-up modalı detay metni" },
  { settingKey: "PopupImageUrl", settingValue: "", groupKey: "Banner", description: "Açılış pop-up görseli / afişi (MinIO'dan yüklenebilir)" },
  { settingKey: "PopupButtonText", settingValue: "Koleksiyonu İncele", groupKey: "Banner", description: "Açılış pop-up buton metni (Boş bırakılırsa buton gizlenir)" },
  { settingKey: "PopupButtonUrl", settingValue: "/koleksiyon/erkek-giyim", groupKey: "Banner", description: "Açılış pop-up butonunun yönlendireceği sayfa linki" },
];

export default function SiteSettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // View state: "cards" (Grup bazlı form) | "table" (Liste tablosu)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Queries & Mutations
  const { data: settingsData, isLoading, isFetching, refetch } = useSiteSettings();
  const createMutation = useCreateSiteSetting();
  const updateMutation = useUpdateSiteSetting();
  const bulkUpdateMutation = useBulkUpdateSiteSettings();
  const deleteMutation = useDeleteSiteSetting();

  const settings: SiteSetting[] = useMemo(() => {
    if (!settingsData) return [];
    const seen = new Set<string>();
    const unique: SiteSetting[] = [];
    settingsData.forEach((s) => {
      const k = s.settingKey?.trim().toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        unique.push(s);
      }
    });
    return unique;
  }, [settingsData]);

  // Local Form State for Grouped/Card Editing
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Sync formValues with fetched settings
  useEffect(() => {
    if (settings && settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach((s) => {
        map[s.settingKey] = s.settingValue ?? "";
      });
      setFormValues(map);
    }
  }, [settings]);

  // Modal State for Add / Single Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);

  const [modalKey, setModalKey] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalGroup, setModalGroup] = useState("General");
  const [modalDescription, setModalDescription] = useState("");

  // Delete State
  const [settingToDelete, setSettingToDelete] = useState<SiteSetting | null>(null);

  // Filtered Settings (Logo ve Favicon alanları geçici olarak gizlendi)
  const filteredSettings = useMemo(() => {
    return settings.filter((item) => {
      const isHiddenKey = ["logourl", "faviconurl"].includes((item.settingKey || "").toLowerCase());
      if (isHiddenKey) return false;

      const matchesGroup =
        selectedGroup === "ALL" || (item.groupKey || "General").toLowerCase() === selectedGroup.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.settingKey.toLowerCase().includes(q) ||
        (item.settingValue && item.settingValue.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.groupKey && item.groupKey.toLowerCase().includes(q));

      return matchesGroup && matchesSearch;
    });
  }, [settings, selectedGroup, searchQuery]);

  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  // Handle Image Upload to MinIO and Auto-save to DB
  const handleImageUpload = async (key: string, file: File) => {
    if (!file) return;
    setUploadingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/api/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url || res.data?.Url || (typeof res.data === "string" ? res.data : "");
      if (url) {
        // Eski dosya varsa MinIO'dan temizle
        const oldUrl = formValues[key];
        if (oldUrl && oldUrl !== url) {
          try {
            await axiosInstance.delete(`/api/uploads/image?fileUrl=${encodeURIComponent(oldUrl)}`);
          } catch (e) {
            console.warn("Eski görsel silinemedi:", e);
          }
        }

        handleInputChange(key, url);
        
        // Veritabanına anında kaydet
        const existingSetting = settings.find((s) => s.settingKey.toLowerCase() === key.toLowerCase());
        if (existingSetting) {
          await updateMutation.mutateAsync({
            id: existingSetting.id,
            settingKey: existingSetting.settingKey,
            settingValue: url,
            groupKey: existingSetting.groupKey || "General",
            description: existingSetting.description,
          });
        } else {
          await createMutation.mutateAsync({
            settingKey: key,
            settingValue: url,
            groupKey: "General",
            description: `${key} görseli`,
          });
        }
        toast.success(`Görsel yüklendi ve kaydedildi.`);
      }
    } catch (err) {
      toast.error("Görsel yüklenirken hata oluştu.");
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Handle Remove Image (MinIO'dan ve DB'den sil)
  const handleRemoveImage = async (key: string) => {
    const currentUrl = formValues[key] || settings.find((s) => s.settingKey.toLowerCase() === key.toLowerCase())?.settingValue;
    handleInputChange(key, "");
    try {
      // 1. MinIO'dan fiziksel dosyayı sil
      if (currentUrl) {
        try {
          await axiosInstance.delete(`/api/uploads/image?fileUrl=${encodeURIComponent(currentUrl)}`);
        } catch (e) {
          console.warn("Görsel silme uyarısı:", e);
        }
      }

      // 2. Veritabanında değeri boşalt
      const existingSetting = settings.find((s) => s.settingKey.toLowerCase() === key.toLowerCase());
      if (existingSetting) {
        await updateMutation.mutateAsync({
          id: existingSetting.id,
          settingKey: existingSetting.settingKey,
          settingValue: "",
          groupKey: existingSetting.groupKey || "General",
          description: existingSetting.description,
        });
        toast.success(`${key} görseli başarıyla kaldırıldı.`);
      }
    } catch (err) {
      toast.error("Görsel kaldırılırken hata oluştu.");
    }
  };

  // Handle Input Change for Form View
  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Bulk Save for Active Group
  const handleSaveActiveGroup = (groupKey: string) => {
    const groupItems = settings.filter(
      (s) => (s.groupKey || "General").toLowerCase() === groupKey.toLowerCase()
    );

    if (groupItems.length === 0) return;

    const seen = new Set<string>();
    const payload: SiteSettingBulkItemDto[] = [];
    groupItems.forEach((item) => {
      const k = item.settingKey?.trim();
      if (k && !seen.has(k.toLowerCase())) {
        seen.add(k.toLowerCase());
        payload.push({
          settingKey: k,
          settingValue: formValues[item.settingKey] ?? item.settingValue ?? "",
          groupKey: item.groupKey,
          description: item.description,
        });
      }
    });

    bulkUpdateMutation.mutate(
      { settings: payload },
      {
        onSuccess: () => {
          toast.success(`${groupKey} grubundaki ayarlar başarıyla kaydedildi.`);
        },
        onError: () => {
          toast.error("Ayarlar kaydedilirken bir hata oluştu.");
        },
      }
    );
  };

  // Bulk Save All Settings
  const handleSaveAll = () => {
    const seen = new Set<string>();
    const payload: SiteSettingBulkItemDto[] = [];
    settings.forEach((item) => {
      const k = item.settingKey?.trim();
      if (k && !seen.has(k.toLowerCase())) {
        seen.add(k.toLowerCase());
        payload.push({
          settingKey: k,
          settingValue: formValues[item.settingKey] ?? item.settingValue ?? "",
          groupKey: item.groupKey,
          description: item.description,
        });
      }
    });

    bulkUpdateMutation.mutate(
      { settings: payload },
      {
        onSuccess: () => {
          toast.success("Tüm site ayarları başarıyla güncellendi.");
        },
        onError: () => {
          toast.error("Ayarlar kaydedilirken hata oluştu.");
        },
      }
    );
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingSetting(null);
    setModalKey("");
    setModalValue("");
    setModalGroup(selectedGroup !== "ALL" ? selectedGroup : "General");
    setModalDescription("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (setting: SiteSetting) => {
    setModalMode("edit");
    setEditingSetting(setting);
    setModalKey(setting.settingKey);
    setModalValue(setting.settingValue || "");
    setModalGroup(setting.groupKey || "General");
    setModalDescription(setting.description || "");
    setIsModalOpen(true);
  };

  // Submit Modal (Create or Single Update)
  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modalKey.trim()) {
      toast.warning("Ayar anahtarı (Key) zorunludur.");
      return;
    }

    if (modalMode === "create") {
      createMutation.mutate(
        {
          settingKey: modalKey.trim(),
          settingValue: modalValue,
          groupKey: modalGroup.trim() || "General",
          description: modalDescription.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Yeni ayar başarıyla oluşturuldu.");
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || err?.message || "Ayar eklenemedi.");
          },
        }
      );
    } else {
      if (!editingSetting) return;

      updateMutation.mutate(
        {
          id: editingSetting.id,
          settingKey: modalKey.trim(),
          settingValue: modalValue,
          groupKey: modalGroup.trim() || "General",
          description: modalDescription.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Ayar başarıyla güncellendi.");
            setIsModalOpen(false);
          },
          onError: () => {
            toast.error("Ayar güncellenirken hata oluştu.");
          },
        }
      );
    }
  };

  // Delete Action
  const handleDelete = () => {
    if (!settingToDelete) return;

    deleteMutation.mutate(settingToDelete.id, {
      onSuccess: () => {
        toast.success(`'${settingToDelete.settingKey}' ayarı silindi.`);
        setSettingToDelete(null);
      },
      onError: () => {
        toast.error("Ayar silinirken hata oluştu.");
        setSettingToDelete(null);
      },
    });
  };

  // Seed / Load Default Presets
  const handleLoadDefaults = () => {
    bulkUpdateMutation.mutate(
      { settings: DEFAULT_PRESETS },
      {
        onSuccess: () => {
          toast.success("Standart ayar şablonları başarıyla yüklendi!");
        },
        onError: () => {
          toast.error("Varsayılan ayarlar yüklenirken hata oluştu.");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Actions Top Bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Site & Genel Ayarlar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Görünüm Değiştirici */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grup Formu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-gray-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tablo</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Yenile"
          >
            <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="ml-1.5 hidden sm:inline">Yenile</span>
          </Button>

          {role !== "VIEWER" && settings.length > 0 && viewMode === "cards" && (
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={bulkUpdateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {bulkUpdateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Tümünü Kaydet
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Search & Group Tabs Bar ─────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Grup Sekmeleri */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => setSelectedGroup("ALL")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedGroup === "ALL"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-gray-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tüm Gruplar ({settings.length})</span>
            </button>

            {SETTING_GROUPS.map((group) => {
              const Icon = group.icon;
              const active = selectedGroup.toLowerCase() === group.key.toLowerCase();
              const count = settings.filter(
                (s) => (s.groupKey || "General").toLowerCase() === group.key.toLowerCase()
              ).length;

              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setSelectedGroup(group.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-gray-900 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{group.label}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hızlı Arama */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ayar anahtarı, değer veya açıklama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* ─── Empty State / Presets Loader ────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground bg-white rounded-2xl border border-gray-200">
          <Spinner size="lg" className="mb-4" />
          <p className="font-medium text-sm">Site ayarları yükleniyor...</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">Henüz Site Ayarı Bulunmuyor</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Sitenizin genel bilgileri, logoları, iletişim kanalları, sosyal medya linkleri ve kargo kuralları için sistem şablonunu tek tıkla yükleyin.
          </p>
          <div className="flex items-center gap-3">
            {role !== "VIEWER" && (
              <Button size="lg" onClick={handleLoadDefaults} disabled={bulkUpdateMutation.isPending} className="px-6 font-semibold shadow-xs">
                {bulkUpdateMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Yükleniyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 text-amber-300" /> Standart Ayar Şablonlarını Yükle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* ─── GÖRÜNÜM 1: Gruplara Göre Form Kartları ───────────────────────── */
        <div className="space-y-6">
          {SETTING_GROUPS.filter(
            (g) => selectedGroup === "ALL" || g.key.toLowerCase() === selectedGroup.toLowerCase()
          ).map((group) => {
            const groupSettings = filteredSettings.filter(
              (s) => (s.groupKey || "General").toLowerCase() === group.key.toLowerCase()
            );

            if (groupSettings.length === 0 && selectedGroup !== "ALL") {
              return (
                <div
                  key={group.key}
                  className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-muted-foreground text-sm"
                >
                  Bu grupta henüz bir ayar bulunmuyor. Yeni bir ayar eklemek için &quot;Yeni Ayar Ekle&quot; butonunu kullanabilirsiniz.
                </div>
              );
            }

            if (groupSettings.length === 0) return null;

            const GroupIcon = group.icon;

            return (
              <Card key={group.key} className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${group.color}`}>
                      <GroupIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">
                        {group.label}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {group.description}
                      </CardDescription>
                    </div>
                  </div>

                  {role !== "VIEWER" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveActiveGroup(group.key)}
                      disabled={bulkUpdateMutation.isPending}
                      className="shrink-0"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Bu Grubu Kaydet
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {groupSettings.map((item) => {
                      const val = formValues[item.settingKey] ?? item.settingValue ?? "";
                      const isLongText = val.length > 60 || item.settingKey.toLowerCase().includes("description") || item.settingKey.toLowerCase().includes("address");
                      const isBoolean = val === "true" || val === "false";

                      return (
                        <div
                          key={item.id}
                          className={`space-y-1.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-gray-300/80 transition-all ${
                            isLongText ? "md:col-span-2" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Label
                              htmlFor={`setting-${item.id}`}
                              className="text-xs font-bold text-gray-900 font-mono flex items-center gap-1.5"
                            >
                              <span>{item.settingKey}</span>
                            </Label>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="text-gray-400 hover:text-primary p-1 rounded transition-colors"
                                title="Ayar Detayını Düzenle"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Açıklama Metni */}
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Info className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                              <span>{item.description}</span>
                            </p>
                          )}

                          {/* Giriş Alanı */}
                          {item.settingKey.toLowerCase().includes("logo") ||
                          item.settingKey.toLowerCase().includes("favicon") ||
                          item.settingKey.toLowerCase().includes("image") ? (
                            <div className="space-y-2">
                              {val ? (
                                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                                  <div className="h-12 w-12 rounded border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                    <img
                                      src={getMinioUrl(val)}
                                      alt={item.settingKey}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-gray-700 truncate">{val}</p>
                                    <a
                                      href={getMinioUrl(val)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                    >
                                      <span>Görseli Aç</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  </div>
                                  {role !== "VIEWER" && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(item.settingKey)}
                                      className="text-gray-400 hover:text-destructive p-1.5 rounded transition-colors"
                                      title="Görseli Kaldır"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ) : null}

                              <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 text-xs text-gray-600 transition-colors">
                                    {uploadingKeys[item.settingKey] ? (
                                      <>
                                        <Spinner size="sm" className="mr-1.5" />
                                        <span>Yükleniyor...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-3.5 w-3.5 text-primary" />
                                        <span>{val ? "Görseli Değiştir" : "Görsel Seç & Yükle"}</span>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*,.ico,.svg"
                                    disabled={role === "VIEWER" || uploadingKeys[item.settingKey]}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(item.settingKey, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : isBoolean ? (
                            <select
                              id={`setting-${item.id}`}
                              value={val}
                              onChange={(e) => handleInputChange(item.settingKey, e.target.value)}
                              disabled={role === "VIEWER"}
                              className="flex h-9 w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="true">Aktif / Açık (true)</option>
                              <option value="false">Pasif / Kapalı (false)</option>
                            </select>
                          ) : isLongText ? (
                            <Textarea
                              id={`setting-${item.id}`}
                              rows={2}
                              value={val}
                              onChange={(e) => handleInputChange(item.settingKey, e.target.value)}
                              disabled={role === "VIEWER"}
                              className="bg-white text-xs"
                              placeholder="Değer giriniz..."
                            />
                          ) : (
                            <Input
                              id={`setting-${item.id}`}
                              value={val}
                              onChange={(e) => handleInputChange(item.settingKey, e.target.value)}
                              disabled={role === "VIEWER"}
                              className="bg-white text-xs h-9"
                              placeholder="Değer giriniz..."
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ─── GÖRÜNÜM 2: Detaylı Tablo Yönetimi ─────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Ayar Anahtarı (Key)</th>
                  <th className="px-5 py-3.5">Grup</th>
                  <th className="px-5 py-3.5">Ayar Değeri (Value)</th>
                  <th className="px-5 py-3.5">Açıklama</th>
                  <th className="px-5 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSettings.map((item) => {
                  const groupMeta = SETTING_GROUPS.find(
                    (g) => g.key.toLowerCase() === (item.groupKey || "General").toLowerCase()
                  );

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Key */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {item.settingKey}
                        </span>
                      </td>

                      {/* Grup */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            groupMeta?.color || "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {groupMeta?.label || item.groupKey || "Genel"}
                        </Badge>
                      </td>

                      {/* Değer */}
                      <td className="px-5 py-4 max-w-md">
                        <div className="text-xs text-gray-800 font-medium truncate">
                          {item.settingValue || <span className="text-muted-foreground italic">Boş / Tanımlanmadı</span>}
                        </div>
                      </td>

                      {/* Açıklama */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description || "-"}
                        </div>
                      </td>

                      {/* İşlemler */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-gray-700 hover:text-primary hover:bg-primary/10"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Düzenle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50/75 border-t border-gray-200 text-xs text-muted-foreground">
            Toplam <strong>{filteredSettings.length}</strong> ayar listeleniyor.
          </div>
        </div>
      )}

      {/* ─── MODAL: Tekil Ayar Ekle / Düzenle ─────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitModal} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {modalMode === "create" ? "Yeni Site Ayarı Ekle" : "Site Ayarını Düzenle"}
              </DialogTitle>
              <DialogDescription>
                Web sitesi genelinde ve müşteri ön yüzünde kullanılacak anahtar-değer ayarı tanımlayın.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="modal-key" className="font-semibold text-gray-700">
                  Ayar Anahtarı (SettingKey) *
                </Label>
                <Input
                  id="modal-key"
                  placeholder="Örn: SiteTitle, FreeShippingThreshold, WhatsAppNumber"
                  value={modalKey}
                  onChange={(e) => setModalKey(e.target.value)}
                  disabled={modalMode === "edit"}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Sistem içi benzersiz tanımlayıcı (Örn: PascalCase).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-group" className="font-semibold text-gray-700">
                  Grup (GroupKey) *
                </Label>
                <select
                  id="modal-group"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={modalGroup}
                  onChange={(e) => setModalGroup(e.target.value)}
                >
                  <option value="General">Genel & SEO (General)</option>
                  <option value="Contact">İletişim & Adres (Contact)</option>
                  <option value="Social">Sosyal Medya (Social)</option>
                  <option value="Commerce">E-Ticaret & Kargo (Commerce)</option>
                  <option value="Banner">Duyuru & Bildirimler (Banner)</option>
                  <option value="Other">Diğer (Other)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-value" className="font-semibold text-gray-700">
                  Ayar Değeri (SettingValue)
                </Label>
                {modalKey.toLowerCase().includes("logo") ||
                modalKey.toLowerCase().includes("favicon") ||
                modalKey.toLowerCase().includes("image") ? (
                  <div className="space-y-2">
                    {modalValue ? (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="h-12 w-12 rounded border bg-white flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={getMinioUrl(modalValue)}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-700 truncate">{modalValue}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalValue("")}
                          className="text-gray-400 hover:text-destructive p-1 rounded transition-colors"
                          title="Kaldır"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}

                    <label className="block cursor-pointer">
                      <div className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 text-xs text-gray-600 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-primary" />
                        <span>{modalValue ? "Görseli Değiştir" : "Görsel Seç & Yükle"}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.ico,.svg"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const res = await axiosInstance.post("/api/uploads/image", formData, {
                              headers: { "Content-Type": "multipart/form-data" },
                            });
                            const url = res.data?.url || res.data?.Url || (typeof res.data === "string" ? res.data : "");
                            if (url) {
                              setModalValue(url);
                              toast.success("Görsel MinIO'ya yüklendi.");
                            }
                          } catch (err) {
                            toast.error("Görsel yüklenemedi.");
                          }
                        }}
                      />
                    </label>

                    <Input
                      id="modal-value"
                      placeholder="veya direkt URL yapıştırın..."
                      value={modalValue}
                      onChange={(e) => setModalValue(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                ) : (
                  <Textarea
                    id="modal-value"
                    rows={3}
                    placeholder="Ayarın metinsel veya sayısal değeri..."
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-desc" className="font-semibold text-gray-700">
                  Açıklama (Opsiyonel)
                </Label>
                <Input
                  id="modal-desc"
                  placeholder="Bu ayarın ne işe yaradığına dair yönetici açıklaması..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                İptal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    {modalMode === "create" ? "Oluştur" : "Değişiklikleri Kaydet"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── ALERT: Ayar Silme Onayı ─────────────────────────────────────────── */}
      <AlertDialog
        open={!!settingToDelete}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setSettingToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu ayarı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{settingToDelete?.settingKey}&quot; ayarı kalıcı olarak silinecektir. Bu ayara bağlı ön yüz bileşenleri varsayılan değerlerine dönebilir.
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
    </div>
  );
}
