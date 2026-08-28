"use client";

import { useEffect, useState } from "react";
import { Coupon, CreateCouponDto, UpdateCouponDto } from "@/types/api.types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { TicketPercent, Sparkles } from "lucide-react";

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Coupon | null;
  isPending: boolean;
  onSubmit: (data: CreateCouponDto | UpdateCouponDto) => void;
}

export function CouponDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: CouponDialogProps) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<string>("Percentage");
  const [value, setValue] = useState<number | string>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [isSingleUsePerUser, setIsSingleUsePerUser] = useState<boolean>(true);
  const [isShowcase, setIsShowcase] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code || "");
      setDiscountType(initialData.discountType || "Percentage");
      setValue(initialData.value || 0);
      setMinOrderAmount(initialData.minOrderAmount || 0);
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : "");
      setEndDate(initialData.endDate ? initialData.endDate.slice(0, 10) : "");
      setUsageLimit(initialData.usageLimit !== null && initialData.usageLimit !== undefined ? String(initialData.usageLimit) : "");
      setIsSingleUsePerUser(initialData.isSingleUsePerUser ?? true);
      setIsShowcase(Boolean(initialData.isShowcase));
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setCode("");
      setDiscountType("Percentage");
      setValue(10);
      setMinOrderAmount(0);
      setStartDate(today);
      setEndDate(nextMonth);
      setUsageLimit("");
      setIsSingleUsePerUser(true);
      setIsShowcase(false);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      usageLimit: usageLimit !== "" && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      isSingleUsePerUser,
      isShowcase,
    };

    if (initialData) {
      payload.id = initialData.id;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-primary" />
            {initialData ? "Kuponu Düzenle" : "Yeni Kupon Oluştur"}
          </DialogTitle>
          <DialogDescription>
            Kullanıcıların ödeme adımında kullanabileceği indirim kuponunu ve limitlerini tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1.5">
            <Label htmlFor="code">Kupon Kodu</Label>
            <Input
              id="code"
              placeholder="Örn: YAZ2026, HOSGELDIN15"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="font-mono uppercase font-bold tracking-wider"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discountType">İndirim Türü</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger id="discountType">
                  <SelectValue placeholder="İndirim Türü Seçin">
                    {discountType === "FixedAmount" ? "Sabit Tutar (₺)" : "Yüzdelik (%)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentage">Yüzdelik (%)</SelectItem>
                  <SelectItem value="FixedAmount">Sabit Tutar (₺)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value">
                {discountType === "Percentage" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"}
              </Label>
              <Input
                id="value"
                type="number"
                min={1}
                max={discountType === "Percentage" ? 100 : 999999}
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-9 text-center text-sm font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minOrderAmount">Min. Sepet Tutarı (₺)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min={0}
                placeholder="0 (Alt limit yok)"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="h-9 text-center text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Toplam Kullanım Limiti</Label>
              <Input
                id="usageLimit"
                type="number"
                min={1}
                placeholder="Sınırsız"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="h-9 text-center text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Kullanıcı Başına Tek Kullanım Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="isSingleUsePerUser" className="text-sm font-semibold cursor-pointer">
                Kişi Başına Tek Kullanım
              </Label>
              <p className="text-xs text-muted-foreground">
                Her üye kullanıcı bu kupondan yalnızca 1 defa yararlanabilir.
              </p>
            </div>
            <Switch
              id="isSingleUsePerUser"
              checked={isSingleUsePerUser}
              onCheckedChange={setIsSingleUsePerUser}
            />
          </div>

          {/* 🌟 Vitrinde / Alt Çubukta Göster Switch 🌟 */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="isShowcase" className="text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Vitrinde / Alt Çubukta Göster
              </Label>
              <p className="text-xs text-muted-foreground">
                Bu kupon mağazada ekranın altındaki sabit çubukta duyurulur.
              </p>
            </div>
            <Switch
              id="isShowcase"
              checked={isShowcase}
              onCheckedChange={setIsShowcase}
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
                "Kupon Oluştur"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
