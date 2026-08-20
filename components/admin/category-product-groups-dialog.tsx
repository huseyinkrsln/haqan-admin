"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Category, ProductGroup } from "@/types/api.types";
import {
  useProductGroups,
  useCreateProductGroup,
  useUpdateProductGroup,
  useDeleteProductGroup,
} from "@/hooks/useProductGroups";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Tag,
  FolderTree,
} from "lucide-react";
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

interface CategoryProductGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  parentCategoryName?: string;
}

export function CategoryProductGroupsDialog({
  open,
  onOpenChange,
  category,
  parentCategoryName,
}: CategoryProductGroupsDialogProps) {
  const categoryId = category?.id;

  const { data: groups, isLoading } = useProductGroups(categoryId);
  const createMutation = useCreateProductGroup();
  const updateMutation = useUpdateProductGroup();
  const deleteMutation = useDeleteProductGroup();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Delete State
  const [toDeleteGroup, setToDeleteGroup] = useState<ProductGroup | null>(null);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditingGroup(null);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: ProductGroup) => {
    const groupName = group.name || (group as any).Name || "";
    const groupSlug = group.slug || (group as any).Slug || "";
    const groupDesc = group.description || (group as any).Description || "";

    setEditingGroup(group);
    setName(groupName);
    setSlug(groupSlug);
    setDescription(groupDesc);
    setIsFormOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingGroup) {
      // Auto slugify
      const generatedSlug = val
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGroup) {
      updateMutation.mutate(
        {
          id: editingGroup.id ?? (editingGroup as any).Id,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId,
        },
        {
          onSuccess: () => resetForm(),
        }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId,
        },
        {
          onSuccess: () => resetForm(),
        }
      );
    }
  };

  const handleDelete = () => {
    if (!toDeleteGroup) return;
    const targetId = toDeleteGroup.id ?? (toDeleteGroup as any).Id;
    deleteMutation.mutate(targetId, {
      onSuccess: () => setToDeleteGroup(null),
    });
  };

  const filteredGroups = (groups || []).filter((g) => {
    const groupName = g.name || (g as any).Name || "";
    const groupSlug = g.slug || (g as any).Slug || "";
    const groupDesc = g.description || (g as any).Description || "";

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      groupName.toLowerCase().includes(term) ||
      groupSlug.toLowerCase().includes(term) ||
      groupDesc.toLowerCase().includes(term)
    );
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-emerald-600" />
                Ürün Grupları (Alt Gruplar):{" "}
                <Badge variant="secondary" className="font-bold text-sm px-2.5 py-0.5">
                  {category?.name}
                </Badge>
              </DialogTitle>
            </div>
            <DialogDescription>
              {parentCategoryName && (
                <span className="text-muted-foreground mr-1.5">
                  Üst Kategori: <strong>{parentCategoryName}</strong> &gt;
                </span>
              )}
              <strong>{category?.name}</strong> kategorisine ait alt ürün gruplarını (örn: Mini Etek, Midi Etek, Pileli Etek) yönetin.
            </DialogDescription>
          </DialogHeader>

          {/* Form Alanı (Ekle / Düzenle) */}
          {isFormOpen && (
            <div className="p-4 rounded-xl border bg-muted/20 shadow-xs space-y-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  {editingGroup ? <Edit2 className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5 text-emerald-600" />}
                  {editingGroup ? `"${editingGroup.name || (editingGroup as any).Name}" Grubunu Düzenle` : `Yeni Ürün Grubu Ekle (${category?.name})`}
                </h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pg-name" className="text-xs">Grup Adı *</Label>
                    <Input
                      id="pg-name"
                      placeholder="Örn: Mini Etek, Kot Etek, Pileli Etek..."
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      className="h-9 text-xs"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pg-slug" className="text-xs">Slug (URL) *</Label>
                    <Input
                      id="pg-slug"
                      placeholder="mini-etek"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className="h-9 text-xs"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pg-desc" className="text-xs">Açıklama (Opsiyonel)</Label>
                  <Input
                    id="pg-desc"
                    placeholder="Grup hakkında kısa açıklama..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-9 text-xs"
                    disabled={isPending}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={isPending}>
                    Vazgeç
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                    {isPending ? (
                      <>
                        <Spinner size="sm" className="mr-1" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {editingGroup ? "Güncelle" : "Grubu Kaydet"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Toolbar: Arama, Sayım & Yeni Ekle Butonu */}
          <div className="flex items-center justify-between gap-3 py-2.5 border-b">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Grup Adı veya Slug Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-2.5 py-1 font-mono">
                Toplam: <strong className="text-primary ml-1">{filteredGroups.length}</strong>
              </Badge>
              {!isFormOpen && (
                <Button onClick={handleOpenAdd} size="sm" className="h-8 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                  <Plus className="h-3.5 w-3.5" /> Yeni Ürün Grubu Ekle
                </Button>
              )}
            </div>
          </div>

          {/* Gruplar Tablo / Liste Görünümü */}
          <div className="flex-1 overflow-y-auto pr-1 py-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Spinner size="lg" className="mb-2" />
                <p className="text-xs">Ürün grupları yükleniyor...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-14 border rounded-xl bg-muted/10">
                <FolderTree className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-semibold text-sm text-foreground">
                  {searchTerm ? "Arama kriterine uygun ürün grubu bulunamadı." : `"${category?.name}" kategorisine ait henüz bir ürün grubu eklenmemiş.`}
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Bu alt kategoriye özel modelleri (Örn: Mini, Midi, Pileli) gruplamak için yeni grup ekleyebilirsiniz.
                </p>
                {!isFormOpen && (
                  <Button onClick={handleOpenAdd} size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> İlk Ürün Grubunu Ekle
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Grup Adı</th>
                      <th className="py-2.5 px-4">Slug (URL)</th>
                      <th className="py-2.5 px-4">Açıklama</th>
                      <th className="py-2.5 px-4 text-right w-24">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredGroups.map((group, idx) => {
                      const groupName = group.name || (group as any).Name || `Grup #${group.id ?? (group as any).Id}`;
                      const groupSlug = group.slug || (group as any).Slug || "-";
                      const groupDesc = group.description || (group as any).Description || "-";

                      return (
                        <tr key={group.id ?? (group as any).Id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-foreground text-sm">
                                {groupName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="font-mono text-[11px] bg-background">
                              /{groupSlug}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground truncate max-w-[220px]">
                            {groupDesc}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:bg-primary/10"
                                onClick={() => handleOpenEdit(group)}
                                title="Düzenle"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => setToDeleteGroup(group)}
                                title="Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Modalı */}
      <AlertDialog open={!!toDeleteGroup} onOpenChange={(open) => { if (!deleteMutation.isPending && !open) setToDeleteGroup(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürün Grubunu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDeleteGroup?.name || (toDeleteGroup as any)?.Name}&quot; ürün grubu silinecek. Emin misiniz?
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
    </>
  );
}
