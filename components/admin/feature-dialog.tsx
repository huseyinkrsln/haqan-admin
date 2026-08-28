"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Feature } from "@/types/api.types";

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Feature | null;
  isPending?: boolean;
  onSubmit: (data: any) => void;
}

import { getMinioUrl } from "@/lib/utils";

export function FeatureDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: FeatureDialogProps) {
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setIconFile(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      name: name.trim(),
    };

    if (iconFile) payload.IconFile = iconFile;

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Özelliği Düzenle" : "Yeni Özellik Ekle"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Özellik bilgilerini ve ikonunu güncelleyin." : "Sisteme ikonlu yeni bir özellik ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Özellik Adı *</Label>
            <Input
              id="f-name"
              ref={firstInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Su Geçirmez"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-icon">İkon Dosyası</Label>
            {initialData?.icon && (
              <div className="mb-2 p-2 bg-white rounded border inline-block">
                <img src={getMinioUrl(initialData.icon)} alt="Icon" className="h-10 object-contain" />
              </div>
            )}
            <Input
              id="f-icon"
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] || null)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground">Yeni bir dosya seçerseniz mevcut ikon değiştirilecektir.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Spinner size="sm" className="mr-2" />{initialData ? "Güncelleniyor..." : "Kaydediliyor..."}</>
              ) : initialData ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
