"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useInfiniteProductsPicker } from "@/hooks/useProducts";
import { ProductPickerDto, ProductPickerColorDto } from "@/types/api.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  Tag,
  Loader2,
  Eye,
  ArrowUpDown,
  UploadCloud,
  X,
  Check,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
import { getMinioUrl } from "@/lib/utils";

interface OutfitItemVariant {
  id: number;
  sizeId: number;
  sizeName: string;
  stockQuantity: number;
}

interface OutfitItem {
  id: number;
  outfitId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productBasePrice: number;
  productDiscountPrice?: number;
  productColorId: number;
  colorName: string;
  colorHexCode: string;
  imageUrl?: string;
  displayOrder: number;
  isRequired: boolean;
  variants: OutfitItemVariant[];
}

interface Outfit {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl: string;
  gender?: string;
  price: number;
  totalOriginalPrice: number;
  discountType?: string;
  discountValue?: number;
  showDiscountBadge: boolean;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
  items: OutfitItem[];
}

export default function OutfitsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [showDiscountBadge, setShowDiscountBadge] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedItems, setSelectedItems] = useState<
    {
      productId: number;
      productName: string;
      productPrice: number;
      productColorId: number;
      colorName: string;
      colorHexCode: string;
      imageUrl?: string;
    }[]
  >([]);

  // Item Picker State inside Modal (Live search + Infinite Scroll)
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Debounce product search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 250);
    return () => clearTimeout(handler);
  }, [productSearch]);

  // 1. Fetch Outfits List
  const { data: outfits = [], isLoading, isFetching, refetch } = useQuery<Outfit[]>({
    queryKey: ["admin-outfits"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/Outfits/getall");
      return res.data?.data || res.data || [];
    },
  });

  // 2. Infinite Scroll Products Picker (Görseller, fiyatlar ve renkler tek sorguda)
  const {
    data: pickerData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPicker,
  } = useInfiniteProductsPicker(debouncedSearch, isModalOpen);

  // Flattened products array from all pages (supports both object and array response)
  const pickerProducts = useMemo(() => {
    if (!pickerData?.pages) return [];
    return pickerData.pages.flatMap((page: any) => {
      if (Array.isArray(page)) return page;
      if (Array.isArray(page?.data)) return page.data;
      if (Array.isArray(page?.Data)) return page.Data;
      return [];
    });
  }, [pickerData]);

  const totalProductsCount = useMemo(() => {
    if (!pickerData?.pages?.[0]) return 0;
    const firstPage: any = pickerData.pages[0];
    return (
      firstPage?.totalRecords ??
      firstPage?.TotalRecords ??
      (Array.isArray(firstPage)
        ? firstPage.length
        : Array.isArray(firstPage?.data)
        ? firstPage.data.length
        : Array.isArray(firstPage?.Data)
        ? firstPage.Data.length
        : 0)
    );
  }, [pickerData]);

  // Intersection observer for infinite scroll sentinel
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !isModalOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isModalOpen]);

  // 3. Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        slug: slug.trim() || undefined,
        description,
        coverImageUrl,
        price: Number(price),
        showDiscountBadge,
        displayOrder: Number(displayOrder),
        isActive,
        items: selectedItems.map((item, idx) => ({
          productId: item.productId,
          productColorId: item.productColorId,
          displayOrder: idx + 1,
          isRequired: true,
        })),
      };

      if (editingOutfit) {
        return axiosInstance.put("/api/Outfits", { ...payload, id: editingOutfit.id });
      } else {
        return axiosInstance.post("/api/Outfits", payload);
      }
    },
    onSuccess: () => {
      toast.success(editingOutfit ? "Kombin güncellendi!" : "Yeni kombin oluşturuldu!");
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Kombin kaydedilirken bir hata oluştu.");
    },
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return axiosInstance.delete("/api/Outfits", { data: { id } });
    },
    onSuccess: () => {
      toast.success("Kombin başarıyla silindi.");
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Kombin silinirken hata oluştu.");
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingOutfit(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setCoverImageUrl("");
    setPrice(0);
    setShowDiscountBadge(false);
    setDisplayOrder(0);
    setIsActive(true);
    setSelectedItems([]);
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Sidebar + butonu (?action=new) tıklandığında oluşturma modalını otomatik aç
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

  // Open Edit Modal
  const handleOpenEdit = (outfit: Outfit) => {
    setEditingOutfit(outfit);
    setTitle(outfit.title);
    setSlug(outfit.slug);
    setDescription(outfit.description || "");
    setCoverImageUrl(outfit.coverImageUrl);
    setPrice(outfit.price);
    setShowDiscountBadge(outfit.showDiscountBadge);
    setDisplayOrder(outfit.displayOrder);
    setIsActive(outfit.isActive);
    setSelectedItems(
      outfit.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productPrice: i.productDiscountPrice ?? i.productBasePrice,
        productColorId: i.productColorId,
        colorName: i.colorName,
        colorHexCode: i.colorHexCode,
        imageUrl: i.imageUrl,
      }))
    );
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Lookbook Cover Upload to MinIO
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/api/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url || res.data?.Url || (typeof res.data === "string" ? res.data : "");
      if (url) {
        setCoverImageUrl(url);
        toast.success("Kapak görseli yüklendi!");
      }
    } catch {
      toast.error("Görsel yüklenirken hata oluştu.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add Product & Color to Outfit
  const handleAddProductColor = (product: ProductPickerDto, color: ProductPickerColorDto) => {
    const cProductColorId = color.productColorId ?? (color as any).ProductColorId;
    const exists = selectedItems.some((item) => item.productColorId === cProductColorId);
    if (exists) {
      toast.error("Bu ürün ve renk zaten kombine eklenmiş.");
      return;
    }

    const pPrice =
      (product.discountPrice ?? (product as any).DiscountPrice) ??
      (product.basePrice ?? (product as any).BasePrice) ??
      0;
    const pName = product.name ?? (product as any).Name;
    const cName = color.colorName ?? (color as any).ColorName ?? "Standart";
    const cHex = color.hexCode ?? (color as any).HexCode ?? "#cccccc";
    const cImg =
      color.imageUrl ??
      (color as any).ImageUrl ??
      product.primaryImageUrl ??
      (product as any).PrimaryImageUrl;

    const newItems = [
      ...selectedItems,
      {
        productId: product.id ?? (product as any).Id,
        productName: pName,
        productPrice: Number(pPrice),
        productColorId: cProductColorId,
        colorName: cName,
        colorHexCode: cHex,
        imageUrl: cImg,
      },
    ];

    setSelectedItems(newItems);

    // Otomatik olarak kombinin paket fiyatını toplam parça fiyatına eşitle
    const sum = newItems.reduce((acc, curr) => acc + curr.productPrice, 0);
    setPrice(sum);

    toast.success(`${pName} (${cName}) kombine eklendi.`);
  };

  // Remove Item from Outfit
  const handleRemoveItem = (index: number) => {
    const newItems = selectedItems.filter((_, idx) => idx !== index);
    setSelectedItems(newItems);
    const sum = newItems.reduce((acc, curr) => acc + curr.productPrice, 0);
    setPrice(sum);
  };

  // Selected Items Total Price
  const itemsTotalPrice = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.productPrice, 0);
  }, [selectedItems]);

  // Table Columns
  const columns = useMemo<ColumnDef<Outfit>[]>(() => [
    {
      accessorKey: "coverImageUrl",
      header: "Görsel",
      cell: ({ row }) => {
        const outfit = row.original;
        return (
          <div className="relative w-12 h-15 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
            <img
              src={getMinioUrl(outfit.coverImageUrl)}
              alt={outfit.title}
              className="w-full h-full object-cover"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Kombin Başlığı",
      cell: ({ row }) => {
        const outfit = row.original;
        return (
          <div className="space-y-0.5 max-w-xs">
            <p className="text-xs font-bold text-gray-900 leading-snug">{outfit.title}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{outfit.slug}</p>
            {outfit.description && (
              <p className="text-[11px] text-gray-500 line-clamp-1">{outfit.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "items",
      header: "İçerik",
      cell: ({ row }) => {
        const outfit = row.original;
        return (
          <div className="space-y-1.5">
            <Badge variant="secondary" className="text-[10px] font-bold py-0 px-2 h-5 bg-gray-100 text-gray-700">
              <Package className="w-3 h-3 mr-1" />
              {outfit.itemCount || outfit.items?.length || 0} Parça
            </Badge>
            <div className="flex items-center -space-x-1.5">
              {outfit.items?.slice(0, 3).map((it, idx) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded-full border border-white overflow-hidden shadow-2xs bg-gray-100"
                  title={it.productName}
                >
                  <img
                    src={getMinioUrl(it.imageUrl || outfit.coverImageUrl)}
                    alt={it.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {outfit.items && outfit.items.length > 3 && (
                <span className="text-[9px] font-semibold text-gray-500 pl-2.5">
                  +{outfit.items.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Fiyat",
      cell: ({ row }) => {
        const outfit = row.original;
        const sumOriginal = outfit.totalOriginalPrice || outfit.items?.reduce((s, i) => s + (i.productDiscountPrice ?? i.productBasePrice), 0) || 0;
        const savings = Math.max(0, sumOriginal - outfit.price);

        return (
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-gray-900">
              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(outfit.price)}
            </p>
            {outfit.showDiscountBadge && sumOriginal > outfit.price && (
              <p className="text-[10px] text-muted-foreground line-through">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(sumOriginal)}
              </p>
            )}
            {outfit.showDiscountBadge && savings > 0 && (
              <p className="text-[10px] font-semibold text-emerald-600">
                +{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(savings)} Avantaj
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "showDiscountBadge",
      header: "Rozet",
      cell: ({ row }) => {
        const hasBadge = row.original.showDiscountBadge;
        return hasBadge ? (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
            <Tag className="w-2.5 h-2.5 mr-1" />
            Aktif
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "displayOrder",
      header: "Sıralama",
      cell: ({ row }) => (
        <span className="text-xs font-mono font-medium text-gray-600">
          {row.original.displayOrder}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Durum",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return active ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
            Yayında
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] font-semibold text-gray-600">
            Taslak
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const outfit = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-primary hover:bg-primary/10"
              onClick={() => handleOpenEdit(outfit)}
              title="Düzenle"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50"
              onClick={() => setDeletingId(outfit.id)}
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Kombin Yönetimi</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Paket ürün kombinleri oluşturun, set fiyatları belirleyin.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Yeni Kombin Oluştur</span>
        </Button>
      </div>

      {/* ─── Data Table with Pagination ─── */}
      <DataTable
        columns={columns}
        data={outfits}
        searchKey="title"
        searchPlaceholder="Kombin adı ile ara..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        totalRecords={outfits.length}
        totalLabel="kombin"
      />

      {/* ─── CREATE / EDIT MODAL ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent showCloseButton={false} style={{ maxWidth: "min(96vw, 1280px)", width: "min(96vw, 1280px)" }} className="max-h-[95vh] overflow-hidden p-0 rounded-3xl border-0 shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                  {editingOutfit ? "Kombini Düzenle" : "Yeni Kombin Oluştur"}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingOutfit ? "Kombin bilgilerini ve parçalarını güncelleyin" : "Kombin görseli, ürünler ve fiyat ayarlayın"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body — Two Column Layout */}
          <div className="flex flex-col lg:flex-row overflow-y-auto flex-1 min-h-0">

            {/* ── LEFT COLUMN: General Info (Top) + Cover Image (Below) ── */}
            <div className="w-full lg:w-[380px] shrink-0 bg-gray-50/80 border-b lg:border-b-0 lg:border-r border-gray-100 p-6 flex flex-col gap-5">

              {/* 1. Genel Bilgiler (Always visible at the top) */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Kombin Bilgileri</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600">Kombin Başlığı *</Label>
                    <Input
                      placeholder="Örn: İtalyan Keten Yaz Kombini"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9 text-xs rounded-xl border-gray-200 bg-white focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600">Sıralama</Label>
                    <div className="relative">
                      <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={displayOrder === 0 ? "" : displayOrder}
                        onChange={(e) => setDisplayOrder(e.target.value === "" ? 0 : Number(e.target.value))}
                        className="h-9 text-xs pl-7 rounded-xl border-gray-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-gray-600">Açıklama</Label>
                  <Input
                    placeholder="Kombin kumaş, tarz veya kullanım önerisi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-9 text-xs rounded-xl border-gray-200 bg-white"
                  />
                </div>

                {/* Compact Toggle Switches */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <label className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag size={12} className="text-amber-500 shrink-0" />
                      <span className="text-[11px] font-medium text-gray-700 truncate">Rozet</span>
                    </div>
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        id="showBadgeNew"
                        checked={showDiscountBadge}
                        onChange={(e) => setShowDiscountBadge(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setShowDiscountBadge(!showDiscountBadge)}
                        className={`w-8 h-4.5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${showDiscountBadge ? "bg-primary" : "bg-gray-200"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${showDiscountBadge ? "translate-x-3.5" : "translate-x-0"}`} />
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Eye size={12} className="text-emerald-500 shrink-0" />
                      <span className="text-[11px] font-medium text-gray-700 truncate">Yayında</span>
                    </div>
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        id="isActiveNew"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setIsActive(!isActive)}
                        className={`w-8 h-4.5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${isActive ? "bg-emerald-500" : "bg-gray-200"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-3.5" : "translate-x-0"}`} />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Lookbook Fotoğrafı (Orantılı & Kompakt Kart) */}
              <div className="space-y-2.5 pt-2 border-t border-gray-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Kombin Fotoğrafı</span>
                  </div>
                  {coverImageUrl && (
                    <label className="cursor-pointer text-[11px] font-medium text-primary hover:underline flex items-center gap-1">
                      <UploadCloud size={12} />
                      Değiştir
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {coverImageUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-2xs max-w-[190px] h-[210px] mx-auto bg-gray-100 flex items-center justify-center">
                    <img
                      src={getMinioUrl(coverImageUrl)}
                      alt="Kapak"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <label className="cursor-pointer bg-white/95 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-white transition-all">
                        <UploadCloud size={13} />
                        Değiştir
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl cursor-pointer bg-white hover:bg-primary/5 transition-all h-[145px] max-w-[210px] mx-auto px-4 w-full">
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-[11px] text-primary font-medium">Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-700">Fotoğraf Yükle</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Dikey manken / kombin görseli</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground border border-gray-200 px-2.5 py-0.5 rounded-full bg-gray-50">
                          JPG, PNG, WEBP
                        </span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Product Picker + Selected Items + Price ── */}
            <div className="flex-1 flex flex-col bg-white min-w-0">

              {/* 3. Kombine Ürün Ekle (Entegre Arama + Infinite Scroll + Görsel & Renk Seçimi) */}
              <div className="p-6 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Kombine Ürün Ekle</span>
                  </div>
                  {totalProductsCount > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Toplam {totalProductsCount} ürün
                    </span>
                  )}
                </div>

                {/* Entegre Canlı Arama Çubuğu */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Ürün adı ile ara... (canlı filtreleme)"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-9 pl-9 pr-8 text-xs rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:ring-primary transition-all"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Infinite Scroll Ürün Listesi */}
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                  {isLoadingPicker ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Ürünler yükleniyor...</span>
                    </div>
                  ) : pickerProducts.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1.5">
                      <Package className="h-7 w-7 text-gray-300 stroke-[1.5]" />
                      <span>{productSearch ? "Aramanıza uygun ürün bulunamadı." : "Henüz listelenecek ürün yok."}</span>
                    </div>
                  ) : (
                    pickerProducts.map((product: any) => {
                      const pId = product.id ?? product.Id;
                      const pName = product.name ?? product.Name;
                      const pBasePrice = product.basePrice ?? product.BasePrice ?? 0;
                      const pDiscountPrice = product.discountPrice ?? product.DiscountPrice;
                      const pImg = product.primaryImageUrl ?? product.PrimaryImageUrl;
                      const pColors: any[] = product.colors ?? product.Colors ?? [];

                      return (
                        <div
                          key={pId}
                          className="p-2.5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          {/* Ürün Görseli & Fiyatı */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-10 h-11 rounded-xl bg-white border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                              {pImg ? (
                                <img
                                  src={getMinioUrl(pImg)}
                                  alt={pName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-800 truncate" title={pName}>
                                {pName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {pDiscountPrice ? (
                                  <>
                                    <span className="text-xs font-bold text-emerald-600">
                                      {Number(pDiscountPrice).toLocaleString("tr-TR")} ₺
                                    </span>
                                    <span className="text-[10px] line-through text-gray-400">
                                      {Number(pBasePrice).toLocaleString("tr-TR")} ₺
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-gray-900">
                                    {Number(pBasePrice).toLocaleString("tr-TR")} ₺
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Doğrudan Renk Seçim Butonları */}
                          <div className="flex items-center gap-1.5 flex-wrap sm:justify-end shrink-0">
                            {pColors && pColors.length > 0 ? (
                              pColors.map((c: any) => {
                                const cProductColorId = c.productColorId ?? c.ProductColorId;
                                const cName = c.colorName ?? c.ColorName ?? "Renk";
                                const cHex = c.hexCode ?? c.HexCode ?? "#cccccc";
                                const cImg = c.imageUrl ?? c.ImageUrl ?? pImg;
                                const isAdded = selectedItems.some((item) => item.productColorId === cProductColorId);

                                return (
                                  <button
                                    key={cProductColorId}
                                    type="button"
                                    onClick={() =>
                                      !isAdded &&
                                      handleAddProductColor(
                                        {
                                          id: pId,
                                          name: pName,
                                          basePrice: pBasePrice,
                                          discountPrice: pDiscountPrice,
                                          primaryImageUrl: pImg,
                                          colors: pColors,
                                        },
                                        {
                                          productColorId: cProductColorId,
                                          colorId: c.colorId ?? c.ColorId ?? 0,
                                          colorName: cName,
                                          hexCode: cHex,
                                          imageUrl: cImg,
                                        }
                                      )
                                    }
                                    disabled={isAdded}
                                    className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all ${
                                      isAdded
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                                        : "bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                                    }`}
                                    title={isAdded ? "Zaten eklendi" : `${cName} rengini kombine ekle`}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: cHex }}
                                    />
                                    <span>{cName}</span>
                                    {isAdded ? (
                                      <Check size={11} className="text-emerald-600 stroke-[2.5]" />
                                    ) : (
                                      <Plus size={11} className="text-gray-400 group-hover:text-primary transition-colors" />
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic px-2 py-0.5 bg-white rounded-lg border border-gray-100">
                                Renk tanımlanmamış
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Infinite Scroll Tetikleyici */}
                  <div ref={observerTarget} className="py-2 flex items-center justify-center min-h-[28px]">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Daha fazla ürün yükleniyor...
                      </div>
                    ) : hasNextPage ? (
                      <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        className="text-[11px] text-gray-400 hover:text-primary font-medium transition-colors"
                      >
                        Daha fazla ürün yükle...
                      </button>
                    ) : pickerProducts.length > 0 ? (
                      <span className="text-[10px] text-gray-400">
                        Tüm ürünler listelendi ({totalProductsCount} ürün)
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Selected Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Seçilen Parçalar
                    </span>
                    {selectedItems.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedItems.length} parça
                      </span>
                    )}
                  </div>
                  {selectedItems.length > 0 && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Liste: <span className="text-gray-800 font-bold">{itemsTotalPrice.toLocaleString("tr-TR")} ₺</span>
                    </span>
                  )}
                </div>

                {selectedItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200/80 rounded-2xl hover:border-gray-300 transition-colors group"
                      >
                        <span className="text-[10px] text-muted-foreground font-bold w-4 shrink-0">{idx + 1}</span>
                        <div className="w-10 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                          {item.imageUrl ? (
                            <img src={getMinioUrl(item.imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={14} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.productName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                              style={{ backgroundColor: item.colorHexCode }}
                            />
                            <span className="text-[10px] text-muted-foreground truncate">{item.colorName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-bold text-gray-800 tabular-nums">
                            {item.productPrice.toLocaleString("tr-TR")} ₺
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all group-hover:opacity-100"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <Layers size={20} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">Henüz parça eklenmedi</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Yukarıdan ürün seçip ekleyin</p>
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="px-6 pb-6 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">5</span>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Kombin Set Fiyatı</span>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Tag size={13} className="text-muted-foreground" />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={price === 0 ? "" : price}
                    onChange={(e) => setPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="h-11 pl-8 pr-10 text-lg font-bold rounded-xl border-gray-200 focus:ring-primary bg-gray-50"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">TL</span>
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">
                      Tekil toplam: <span className="font-semibold text-gray-700">{itemsTotalPrice.toLocaleString("tr-TR")} ₺</span>
                    </span>
                    {itemsTotalPrice > price && price > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {(itemsTotalPrice - price).toLocaleString("tr-TR")} ₺ avantaj
                      </span>
                    ) : itemsTotalPrice === price ? (
                      <span className="text-[10px] text-muted-foreground">İndirim yok</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-white">
            <p className="text-[11px] text-muted-foreground">
              {selectedItems.length === 0 && "En az 1 parça ekleyiniz"}
              {!coverImageUrl && selectedItems.length > 0 && "Kombin fotoğrafı zorunludur"}
              {!title && "Kombin başlığı zorunludur"}
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-5 rounded-xl text-xs border-gray-200"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title || !coverImageUrl || selectedItems.length === 0}
                className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold shadow-sm"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Kaydediliyor...</>
                ) : editingOutfit ? (
                  <><Check className="h-3.5 w-3.5 mr-1.5" /> Değişiklikleri Kaydet</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Kombini Oluştur</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg font-bold">Kombini Sil</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Bu kombini silmek istediğinize emin misiniz? Kombin yayından kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs"
            >
              Kombini Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
