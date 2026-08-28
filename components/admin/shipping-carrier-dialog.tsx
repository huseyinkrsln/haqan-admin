"use client";

import { useEffect, useState } from "react";
import { ShippingCarrier } from "@/types/api.types";
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
import { Truck } from "lucide-react";

interface ShippingCarrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ShippingCarrier | null;
  isPending: boolean;
  onSubmit: (data: any) => void;
}

export function ShippingCarrierDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: ShippingCarrierDialogProps) {
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState<number | string>("");
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setBasePrice(initialData.basePrice !== undefined ? initialData.basePrice : "");
      setTrackingUrlTemplate(initialData.trackingUrlTemplate || "");
    } else {
      setName("");
      setBasePrice("");
      setTrackingUrlTemplate("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: name.trim(),
      basePrice: Number(basePrice) || 0,
      trackingUrlTemplate: trackingUrlTemplate.trim() || undefined,
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
            <Truck className="h-5 w-5 text-primary" />
            {initialData ? "Kargo Firmasını Düzenle" : "Yeni Kargo Firması Ekle"}
          </DialogTitle>
          <DialogDescription>
            Sipariş gönderimlerinde kullanılacak kargo firmasını ve takip linki şablonunu tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1.5">
            <Label htmlFor="carrier-name">Firma Adı <span className="text-destructive">*</span></Label>
            <Input
              id="carrier-name"
              placeholder="Örn: Yurtiçi Kargo, Aras Kargo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base-price">Standart Kargo Ücreti (₺)</Label>
            <Input
              id="base-price"
              type="number"
              step="0.01"
              min={0}
              placeholder="0.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="h-9 text-center text-sm font-mono font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tracking-template">Takip URL Şablonu</Label>
            <Input
              id="tracking-template"
              placeholder="Örn: https://kargotakip.com/?no={0}"
              value={trackingUrlTemplate}
              onChange={(e) => setTrackingUrlTemplate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Takip numarasının yerleşeceği yere <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">&#123;0&#125;</code> yazın.
            </p>
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
                "Firma Ekle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
