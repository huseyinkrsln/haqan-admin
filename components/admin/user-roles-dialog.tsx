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
import { User, useUserGroups, useUpdateUserGroups } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { ShieldCheck, Search, CheckSquare, Square, Check, User as UserIcon } from "lucide-react";

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserRolesDialog({
  open,
  onOpenChange,
  user,
}: UserRolesDialogProps) {
  const userId = user?.userId ?? user?.UserId ?? user?.id;
  const { data: allRoles, isLoading: loadingRoles } = useRoles();
  const { data: assignedGroups, isLoading: loadingAssigned } = useUserGroups(userId);
  const updateMutation = useUpdateUserGroups();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Sync initial assigned groups when dialog opens or data loads
  useEffect(() => {
    if (open) {
      const initialSet = new Set<number>();
      if (assignedGroups && assignedGroups.length > 0) {
        assignedGroups.forEach((item) => {
          const idNum = Number(item.id);
          if (!isNaN(idNum)) {
            initialSet.add(idNum);
          }
        });
      } else if (user?.userGroups || user?.UserGroups) {
        const groups = user.userGroups || user.UserGroups || [];
        groups.forEach((item) => {
          const idNum = Number(item.id);
          if (!isNaN(idNum)) {
            initialSet.add(idNum);
          }
        });
      }
      setSelectedIds(initialSet);
    }
  }, [open, assignedGroups, user]);

  // Reset search when opening
  useEffect(() => {
    if (open) setSearchTerm("");
  }, [open]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!allRoles) return [];
    if (!searchTerm.trim()) return allRoles;
    const term = searchTerm.toLowerCase();
    return allRoles.filter(
      (r) =>
        (r.groupName && r.groupName.toLowerCase().includes(term)) ||
        (r.GroupName && r.GroupName.toLowerCase().includes(term)) ||
        String(r.id).includes(term)
    );
  }, [allRoles, searchTerm]);

  const toggleRole = (id: number) => {
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
      filteredRoles.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredRoles.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  const handleSave = () => {
    if (!userId) return;
    updateMutation.mutate(
      {
        userId,
        groupIds: Array.from(selectedIds),
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const isLoading = loadingRoles || loadingAssigned;
  const userName = user?.fullName || user?.FullName || user?.email || user?.Email || `Kullanıcı #${userId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Kullanıcı Rolleri: <Badge variant="secondary" className="font-bold text-sm px-2.5 py-0.5">{userName}</Badge>
            </DialogTitle>
          </div>
          <DialogDescription>
            Bu kullanıcıya atanacak rolleri (grupları) seçin. Kullanıcı, seçilen tüm rollerin yetkilerine sahip olacaktır.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar: Arama ve Hızlı Seçim */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2.5 border-b">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rol Ara (örn: SuperAdmin, Customer, Guest)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs px-2.5 py-1 font-mono whitespace-nowrap bg-muted/40 text-foreground">
              Seçili: <strong className="text-primary ml-1 mr-0.5">{selectedIds.size}</strong> / {allRoles?.length || 0}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="h-8 text-xs gap-1.5 whitespace-nowrap"
              type="button"
            >
              <CheckSquare className="h-3.5 w-3.5" /> Tümünü Seç
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAllFiltered}
              className="h-8 text-xs gap-1.5 whitespace-nowrap text-muted-foreground hover:text-destructive hover:border-destructive/30"
              type="button"
            >
              <Square className="h-3.5 w-3.5" /> Temizle
            </Button>
          </div>
        </div>

        {/* Roller Listesi */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Spinner size="lg" className="mb-3" />
              <p>Roller yükleniyor...</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Tanımlı rol bulunamadı veya arama kriteriyle eşleşmedi.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredRoles.map((role) => {
                const isChecked = selectedIds.has(role.id);
                const roleTitle = role.groupName || role.GroupName || `Rol #${role.id}`;

                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                      isChecked
                        ? "bg-primary/10 border-primary/50 text-foreground shadow-2xs"
                        : "bg-muted/20 border-border/70 hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate text-foreground flex items-center gap-1.5" title={roleTitle}>
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{roleTitle}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Rol ID: #{role.id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                Rolleri Kaydet ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
