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
import { Brand } from "@/types/api.types";

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Brand | null;
  isPending?: boolean;
  onSubmit: (data: any) => void;
}

import { getMinioUrl } from "@/lib/utils";

export function BrandDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: BrandDialogProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setLogo(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      name: name.trim(),
    };

    if (logo) payload.logo = logo; // Backend IFormFile Logo bekliyor, axios interceptor veya useBrands formData append 'logo' ismini alıp ekliyor

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Markayı Düzenle" : "Yeni Marka Ekle"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Marka bilgilerini ve logosunu güncelleyin." : "Sisteme logolu yeni bir marka ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1.5">
            <Label htmlFor="b-name">Marka Adı *</Label>
            <Input
              id="b-name"
              ref={firstInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Nike"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-logo">Marka Logosu</Label>
            {initialData?.logoUrl && (
              <div className="mb-2 p-2 bg-white rounded border inline-block">
                <img src={getMinioUrl(initialData.logoUrl)} alt="Logo" className="h-10 object-contain" />
              </div>
            )}
            <Input
              id="b-logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground">Yeni bir dosya seçerseniz mevcut logo değiştirilecektir.</p>
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
