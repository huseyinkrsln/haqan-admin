"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Role } from "@/types/api.types";
import { ShieldCheck } from "lucide-react";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Role | null;
  isPending: boolean;
  onSubmit: (data: any) => void;
}

export function RoleDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: RoleDialogProps) {
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.groupName || initialData.GroupName || "");
    } else {
      setGroupName("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      groupName: groupName.trim(),
    };

    if (initialData) {
      payload.id = initialData.id;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {initialData ? "Rolü Düzenle" : "Yeni Rol Ekle"}
          </DialogTitle>
          <DialogDescription>
            Sistem kullanıcıları için yetkilendirme grubu / rol tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Rol / Grup Adı <span className="text-destructive">*</span></Label>
            <Input
              id="group-name"
              placeholder="Örn: SUPER_ADMIN, EDITOR, VIEWER"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Kaydediliyor...
                </>
              ) : initialData ? (
                "Güncelle"
              ) : (
                "Rol Ekle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
