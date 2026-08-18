"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Role, OperationClaim } from "@/types/api.types";
import { useOperationClaims, useGroupClaims, useUpdateGroupClaims } from "@/hooks/useRoles";
import { ShieldCheck, Key, Search, CheckSquare, Square, Check, Filter } from "lucide-react";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
}: RolePermissionsDialogProps) {
  const groupId = role?.id;
  const { data: allClaims, isLoading: loadingAll } = useOperationClaims();
  const { data: assignedClaims, isLoading: loadingAssigned } = useGroupClaims(groupId);
  const updateMutation = useUpdateGroupClaims();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Sync initial assigned claims when dialog opens or data loads
  useEffect(() => {
    if (open && assignedClaims) {
      const initialSet = new Set<number>();
      assignedClaims.forEach((item) => {
        const idNum = Number(item.id);
        if (!isNaN(idNum)) {
          initialSet.add(idNum);
        }
      });
      setSelectedIds(initialSet);
    }
  }, [open, assignedClaims]);

  // Reset search when opening
  useEffect(() => {
    if (open) setSearchTerm("");
  }, [open]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    if (!allClaims) return [];
    if (!searchTerm.trim()) return allClaims;
    const term = searchTerm.toLowerCase();
    return allClaims.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.alias && c.alias.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [allClaims, searchTerm]);

  // Group filtered claims by category prefix (e.g. GetProductsQuery -> Products, CreateUserCommand -> Users)
  const groupedClaims = useMemo(() => {
    const groups: Record<string, OperationClaim[]> = {};

    filteredClaims.forEach((claim) => {
      const name = claim.name || "";
      let category = "Genel & Diğer";

      if (/product/i.test(name)) category = "Ürünler & Varyantlar";
      else if (/order/i.test(name)) category = "Siparişler & Ödemeler";
      else if (/category/i.test(name)) category = "Kategoriler";
      else if (/brand/i.test(name)) category = "Markalar";
      else if (/user/i.test(name)) category = "Kullanıcılar";
      else if (/group|role/i.test(name)) category = "Roller & Yetkiler";
      else if (/cart/i.test(name)) category = "Sepetler";
      else if (/coupon/i.test(name)) category = "Kuponlar";
      else if (/slider/i.test(name)) category = "Slider & Banner";
      else if (/stock/i.test(name)) category = "Stok Hareketleri";
      else if (/shipping/i.test(name)) category = "Kargo Firmaları";
      else if (/color/i.test(name)) category = "Renkler";
      else if (/size/i.test(name)) category = "Bedenler";
      else if (/feature/i.test(name)) category = "Özellikler";
      else if (/claim/i.test(name)) category = "Yetki Tanımları";

      if (!groups[category]) groups[category] = [];
      groups[category].push(claim);
    });

    return groups;
  }, [filteredClaims]);

  const toggleClaim = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredClaims.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredClaims.forEach((c) => next.delete(c.id));
      return next;
    });
  };

  const handleSave = () => {
    if (!groupId) return;
    updateMutation.mutate(
      {
        groupId,
        claimIds: Array.from(selectedIds),
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const isLoading = loadingAll || loadingAssigned;
  const roleName = role?.groupName || role?.GroupName || `#${role?.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-amber-500" />
              Rol İzinleri & Yetkilendirme: <Badge variant="secondary" className="font-bold text-sm px-2 py-0.5">{roleName}</Badge>
            </DialogTitle>
          </div>
          <DialogDescription>
            Bu role sahip kullanıcıların sistemde erişebileceği yetkileri ve işlem izinlerini işaretleyin.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar: Arama ve Hızlı Seçim */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 border-b">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İzin veya Yetki Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-semibold text-muted-foreground mr-2">
              Seçili: <strong>{selectedIds.size}</strong> / {allClaims?.length || 0}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="h-8 text-xs gap-1"
              type="button"
            >
              <CheckSquare className="h-3.5 w-3.5" /> Tümünü Seç
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAllFiltered}
              className="h-8 text-xs gap-1 text-muted-foreground"
              type="button"
            >
              <Square className="h-3.5 w-3.5" /> Temizle
            </Button>
          </div>
        </div>

        {/* İzinler Listesi */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Spinner size="lg" className="mb-3" />
              <p>İzin listesi yükleniyor...</p>
            </div>
          ) : Object.keys(groupedClaims).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Aramanızla eşleşen herhangi bir izin bulunamadı.
            </div>
          ) : (
            Object.entries(groupedClaims).map(([category, claims]) => {
              const categorySelectedCount = claims.filter((c) => selectedIds.has(c.id)).length;
              const isAllCatSelected = categorySelectedCount === claims.length && claims.length > 0;

              return (
                <div key={category} className="space-y-2.5 rounded-lg border p-3.5 bg-card/60">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{category}</span>
                      <Badge variant="outline" className="text-[11px] font-normal py-0 px-1.5">
                        {categorySelectedCount}/{claims.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-primary px-2"
                      onClick={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (isAllCatSelected) {
                            claims.forEach((c) => next.delete(c.id));
                          } else {
                            claims.forEach((c) => next.add(c.id));
                          }
                          return next;
                        });
                      }}
                    >
                      {isAllCatSelected ? "Kaldır" : "Grubu Seç"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {claims.map((claim) => {
                      const isChecked = selectedIds.has(claim.id);
                      return (
                        <div
                          key={claim.id}
                          onClick={() => toggleClaim(claim.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-all select-none ${
                            isChecked
                              ? "bg-primary/10 border-primary/40 text-foreground"
                              : "bg-muted/20 border-border/70 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-muted-foreground/40 bg-background"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate text-foreground">
                              {claim.name || `İzin #${claim.id}`}
                            </div>
                            {(claim.alias || claim.description) && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                {claim.alias || claim.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="gap-1.5"
          >
            {updateMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Yetkileri Kaydet ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
