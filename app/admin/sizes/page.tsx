"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Layers, 
  Ruler, 
  Search, 
  FolderPlus, 
  Tag, 
  RotateCw,
  Sparkles,
  Info,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { 
  useSizeGroups, 
  useCreateSizeGroup, 
  useUpdateSizeGroup, 
  useDeleteSizeGroup 
} from "@/hooks/useSizeGroups";
import { 
  useSizes, 
  useCreateSize, 
  useUpdateSize, 
  useDeleteSize 
} from "@/hooks/useSizes";
import { Size, SizeGroup } from "@/types/api.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
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

export default function SizesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: sizeGroups = [], isLoading: isGroupsLoading, isFetching: isGroupsFetching, refetch: refetchGroups } = useSizeGroups();
  const { data: allSizes = [], isLoading: isSizesLoading, refetch: refetchSizes } = useSizes();

  // Mutations
  const createGroupMutation = useCreateSizeGroup();
  const updateGroupMutation = useUpdateSizeGroup();
  const deleteGroupMutation = useDeleteSizeGroup();

  const createSizeMutation = useCreateSize();
  const updateSizeMutation = useUpdateSize();
  const deleteSizeMutation = useDeleteSize();

  // Group Dialog State
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SizeGroup | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");

  // Size Dialog State
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [sizeNameInput, setSizeNameInput] = useState("");
  const [sizeGroupIdInput, setSizeGroupIdInput] = useState<number | "">("");

  // Delete Confirmations
  const [groupToDelete, setGroupToDelete] = useState<SizeGroup | null>(null);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);

  const sizesInGroupToDelete = useMemo(() => {
    if (!groupToDelete) return [];
    return allSizes.filter((s) => s.sizeGroupId === groupToDelete.id);
  }, [groupToDelete, allSizes]);

  const hasSizesInGroup = sizesInGroupToDelete.length > 0;

  // Stats calculation
  const totalGroups = sizeGroups.length;
  const totalSizes = useMemo(() => {
    // Toplam bedenleri sizeGroups altındaki sizes veya allSizes üzerinden say
    const groupSizesCount = sizeGroups.reduce((acc, g) => acc + (g.sizes?.length || 0), 0);
    return Math.max(groupSizesCount, allSizes.length);
  }, [sizeGroups, allSizes]);

  // Combined & Filtered Data
  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return sizeGroups;

    return sizeGroups.filter((g) => {
      const matchGroupName = g.name.toLowerCase().includes(term);
      const matchSizes = g.sizes?.some((s) => s.name.toLowerCase().includes(term));
      return matchGroupName || matchSizes;
    });
  }, [sizeGroups, searchTerm]);

  // ─── Group Handlers ──────────────────────────────────────────────────────────

  const handleOpenGroupDialog = (group?: SizeGroup) => {
    if (group) {
      setSelectedGroup(group);
      setGroupNameInput(group.name);
    } else {
      setSelectedGroup(null);
      setGroupNameInput("");
    }
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) {
      toast.error("Lütfen grup adını giriniz.");
      return;
    }

    if (selectedGroup) {
      updateGroupMutation.mutate(
        { id: selectedGroup.id, name: groupNameInput.trim() },
        {
          onSuccess: () => {
            toast.success("Beden grubu güncellendi.");
            setGroupDialogOpen(false);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data || err.message || "Beden grubu güncellenirken hata oluştu.";
            toast.error(typeof msg === "string" ? msg : "Beden grubu güncellenirken hata oluştu.");
          },
        }
      );
    } else {
      createGroupMutation.mutate(
        { name: groupNameInput.trim() },
        {
          onSuccess: () => {
            toast.success("Beden grubu başarıyla eklendi.");
            setGroupDialogOpen(false);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data || err.message || "Beden grubu eklenirken hata oluştu.";
            toast.error(typeof msg === "string" ? msg : "Beden grubu eklenirken hata oluştu.");
          },
        }
      );
    }
  };

  const handleDeleteGroup = () => {
    if (!groupToDelete) return;
    deleteGroupMutation.mutate(groupToDelete.id, {
      onSuccess: () => {
        toast.success("Beden grubu silindi.");
        setGroupToDelete(null);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || err.message || "Beden grubu silinirken hata oluştu.";
        toast.error(typeof msg === "string" ? msg : "Beden grubu silinirken hata oluştu.");
      },
    });
  };

  // ─── Size Handlers ───────────────────────────────────────────────────────────

  const handleOpenSizeDialog = (size?: Size, defaultGroupId?: number) => {
    if (size) {
      setSelectedSize(size);
      setSizeNameInput(size.name);
      setSizeGroupIdInput(size.sizeGroupId);
    } else {
      setSelectedSize(null);
      setSizeNameInput("");
      setSizeGroupIdInput(defaultGroupId || (sizeGroups[0]?.id ?? ""));
    }
    setSizeDialogOpen(true);
  };

  const handleSaveSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeNameInput.trim()) {
      toast.error("Lütfen beden adını giriniz (Örn: M, 42, Standart).");
      return;
    }
    if (!sizeGroupIdInput) {
      toast.error("Lütfen bir beden grubu seçiniz.");
      return;
    }

    if (selectedSize) {
      updateSizeMutation.mutate(
        {
          id: selectedSize.id,
          name: sizeNameInput.trim(),
          sizeGroupId: Number(sizeGroupIdInput),
        },
        {
          onSuccess: () => {
            toast.success("Beden güncellendi.");
            setSizeDialogOpen(false);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data || err.message || "Beden güncellenirken hata oluştu.";
            toast.error(typeof msg === "string" ? msg : "Beden güncellenirken hata oluştu.");
          },
        }
      );
    } else {
      createSizeMutation.mutate(
        {
          name: sizeNameInput.trim(),
          sizeGroupId: Number(sizeGroupIdInput),
        },
        {
          onSuccess: () => {
            toast.success("Beden başarıyla eklendi.");
            setSizeDialogOpen(false);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data || err.message || "Beden eklenirken hata oluştu.";
            toast.error(typeof msg === "string" ? msg : "Beden eklenirken hata oluştu.");
          },
        }
      );
    }
  };

  const handleDeleteSize = () => {
    if (!sizeToDelete) return;
    deleteSizeMutation.mutate(sizeToDelete.id, {
      onSuccess: () => {
        toast.success("Beden silindi.");
        setSizeToDelete(null);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || err.message || "Beden silinirken hata oluştu.";
        toast.error(typeof msg === "string" ? msg : "Beden silinirken hata oluştu.");
      },
    });
  };

  const handleRefresh = () => {
    refetchGroups();
    refetchSizes();
  };

  const isLoading = isGroupsLoading || isSizesLoading;
  const isPendingGroup = createGroupMutation.isPending || updateGroupMutation.isPending;
  const isPendingSize = createSizeMutation.isPending || updateSizeMutation.isPending;

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
              <BreadcrumbPage>Bedenler & Grupları</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {role !== "VIEWER" && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isGroupsFetching}
              title="Yenile"
            >
              <RotateCw className={`h-4 w-4 ${isGroupsFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenSizeDialog()}
              disabled={sizeGroups.length === 0}
            >
              <Plus className="mr-1.5 h-4 w-4 text-emerald-600" /> Beden Ekle
            </Button>
            <Button onClick={() => handleOpenGroupDialog()}>
              <FolderPlus className="mr-1.5 h-4 w-4" /> Beden Grubu Ekle
            </Button>
          </div>
        )}
      </div>

      {/* ─── Stats & Search Bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Toplam Beden Grubu</p>
            <h4 className="text-2xl font-bold mt-1 text-gray-900">{totalGroups}</h4>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanımlı Beden Sayısı</p>
            <h4 className="text-2xl font-bold mt-1 text-gray-900">{totalSizes}</h4>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Ruler className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Grup veya beden ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* ─── Main Content: Size Groups & Sizes ───────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white rounded-2xl border border-gray-200">
          <Spinner size="lg" className="mb-4" />
          <p className="font-medium text-sm">Beden grupları ve bedenler yükleniyor...</p>
        </div>
      ) : sizeGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Henüz Beden Grubu Eklenmemiş</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Ürün varyantlarını doğru bedenlerle yönetmek için önce beden grupları (örn: Üst Giyim, Pantolon, Ayakkabı) oluşturun.
          </p>
          {role !== "VIEWER" && (
            <Button onClick={() => handleOpenGroupDialog()}>
              <FolderPlus className="mr-2 h-4 w-4" /> İlk Beden Grubunu Oluştur
            </Button>
          )}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200">
          <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h4 className="text-base font-semibold text-gray-800">Arama sonucu bulunamadı</h4>
          <p className="text-xs text-muted-foreground mt-1">
            &quot;{searchTerm}&quot; ifadesine uygun beden grubu veya beden bulunamadı.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGroups.map((group) => {
            const sizes = group.sizes || [];
            return (
              <div
                key={group.id}
                className="group bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Grup Başlığı ve Üst Bar */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Layers className="h-5 w-5 text-[#4A5D3E]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base truncate">{group.name}</h3>
                        <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 shrink-0">
                          {sizes.length} Beden
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: #{group.id} • Grup Beden Seçenekleri
                      </p>
                    </div>
                  </div>

                  {role !== "VIEWER" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                        onClick={() => handleOpenGroupDialog(group)}
                        title="Grubu Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => setGroupToDelete(group)}
                        title="Grubu Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grup İçindeki Bedenler Listesi */}
                <div className="p-4 sm:p-5 flex-1">
                  {sizes.length === 0 ? (
                    <div className="py-6 px-4 text-center rounded-xl bg-gray-50/60 border border-dashed border-gray-200">
                      <Info className="h-6 w-6 text-muted-foreground/60 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-gray-600">Bu grupta henüz beden tanımlanmamış.</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ürün eklerken beden seçeneklerini sunabilmek için beden ekleyin.
                      </p>
                      {role !== "VIEWER" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-xs h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleOpenSizeDialog(undefined, group.id)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Beden Ekle
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <div
                          key={size.id}
                          className="group/tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5 hover:shadow-2xs transition-all duration-150 text-sm font-medium text-gray-800"
                        >
                          <Tag className="h-3 w-3 text-muted-foreground group-hover/tag:text-primary transition-colors" />
                          <span>{size.name}</span>

                          {role !== "VIEWER" && (
                            <div className="flex items-center gap-0.5 ml-1.5 border-l border-gray-200 pl-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenSizeDialog(size, group.id)}
                                className="p-0.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                title="Bedeni Düzenle"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSizeToDelete(size)}
                                className="p-0.5 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                title="Bedeni Sil"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Hızlı Beden Ekle Butonu */}
                      {role !== "VIEWER" && (
                        <button
                          type="button"
                          onClick={() => handleOpenSizeDialog(undefined, group.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Beden Ekle
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Kart Alt Çubuğu */}
                <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Gruba bağlı {sizes.length} aktif beden</span>
                  {role !== "VIEWER" && (
                    <button
                      type="button"
                      onClick={() => handleOpenSizeDialog(undefined, group.id)}
                      className="font-semibold text-[#4A5D3E] hover:underline"
                    >
                      + Beden Ekle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: Beden Grubu Ekle / Düzenle ───────────────────────────────── */}
      <Dialog open={groupDialogOpen} onOpenChange={isPendingGroup ? undefined : setGroupDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {selectedGroup ? "Beden Grubunu Düzenle" : "Yeni Beden Grubu Ekle"}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup
                ? "Beden grubunun ismini güncelleyin."
                : "Ürünlerde bedenleri organize etmek için yeni bir grup tanımlayın."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroup} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Grup Adı *</Label>
              <Input
                id="group-name"
                placeholder="Örn: Üst Giyim, Pantolon, Ayakkabı, Takım Elbise"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                disabled={isPendingGroup}
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGroupDialogOpen(false)}
                disabled={isPendingGroup}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isPendingGroup}>
                {isPendingGroup ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {selectedGroup ? "Güncelleniyor..." : "Kaydediliyor..."}
                  </>
                ) : selectedGroup ? (
                  "Güncelle"
                ) : (
                  "Grup Oluştur"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Beden Ekle / Düzenle ─────────────────────────────────────── */}
      <Dialog open={sizeDialogOpen} onOpenChange={isPendingSize ? undefined : setSizeDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSize ? "Bedeni Düzenle" : "Yeni Beden Ekle"}
            </DialogTitle>
            <DialogDescription>
              {selectedSize
                ? "Beden adını veya bağlı olduğu grubu güncelleyin."
                : "Seçtiğiniz beden grubuna yeni bir beden ekleyin."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSize} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="size-group-select">Beden Grubu *</Label>
              <select
                id="size-group-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={sizeGroupIdInput}
                onChange={(e) => setSizeGroupIdInput(Number(e.target.value))}
                disabled={isPendingSize}
                required
              >
                <option value="" disabled>
                  Beden Grubu Seçiniz...
                </option>
                {sizeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size-name">Beden Adı / Numarası *</Label>
              <Input
                id="size-name"
                placeholder="Örn: S, M, L, XL, 38, 40, 42, 42.5, Standart"
                value={sizeNameInput}
                onChange={(e) => setSizeNameInput(e.target.value)}
                disabled={isPendingSize}
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Giyim için S, M, L, XL; Ayakkabı için 40, 41, 42; Pantolon için 30/32 gibi formatlar girebilirsiniz.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSizeDialogOpen(false)}
                disabled={isPendingSize}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isPendingSize}>
                {isPendingSize ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {selectedSize ? "Güncelleniyor..." : "Kaydediliyor..."}
                  </>
                ) : selectedSize ? (
                  "Güncelle"
                ) : (
                  "Bedeni Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── ALERT: Beden Grubu Silme Onayı ─────────────────────────────────── */}
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => {
          if (!deleteGroupMutation.isPending && !open) setGroupToDelete(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Beden Grubunu Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{groupToDelete?.name}&quot;</strong> beden grubunu silmek üzeresiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasSizesInGroup ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-2 my-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Bu gruba bağlı {sizesInGroupToDelete.length} adet beden bulunmaktadır:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sizesInGroupToDelete.map((s) => (
                  <span key={s.id} className="px-2 py-0.5 bg-white/80 dark:bg-zinc-800 border border-amber-500/20 rounded font-medium text-foreground text-[11px]">
                    {s.name}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                İçinde beden tanımlı olan beden grupları doğrudan silinemez. Silme işlemi yapabilmek için önce bu gruba ait bedenleri silmeli veya başka bir gruba taşımalısınız.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground my-1">
              Bu işlem beden grubunu sistemden kaldıracaktır. Bu işlem geri alınamaz.
            </p>
          )}

          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel disabled={deleteGroupMutation.isPending}>
              {hasSizesInGroup ? "Kapat" : "İptal"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteGroup();
              }}
              disabled={deleteGroupMutation.isPending || hasSizesInGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGroupMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Grubu Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── ALERT: Beden Silme Onayı ───────────────────────────────────────── */}
      <AlertDialog
        open={!!sizeToDelete}
        onOpenChange={(open) => {
          if (!deleteSizeMutation.isPending && !open) setSizeToDelete(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Bedeni Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{sizeToDelete?.name}&quot;</strong> bedenini silmek üzeresiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-xs text-muted-foreground my-1">
            Bu işlem bedeni sistemden kaldıracaktır. Eğer bu bedene bağlı ürün varyantları varsa silme işlemi engellenecektir.
          </p>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel disabled={deleteSizeMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSize();
              }}
              disabled={deleteSizeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSizeMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Bedeni Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
