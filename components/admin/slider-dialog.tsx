"use client";

import { useEffect, useState } from "react";
import { Slider, CreateSliderDto, UpdateSliderDto } from "@/types/api.types";
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
import { getMinioUrl } from "@/lib/utils";
import { Image as ImageIcon, Upload, AlertCircle } from "lucide-react";

interface SliderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Slider | null;
  isPending: boolean;
  onSubmit: (data: CreateSliderDto | UpdateSliderDto) => void;
}

export function SliderDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: SliderDialogProps) {
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number | string>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);

  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string>("");
  const [mobileImageError, setMobileImageError] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSubTitle(initialData.subTitle || "");
      setTargetUrl(initialData.targetUrl || "");
      setButtonText(initialData.buttonText || "");
      setDisplayOrder(initialData.displayOrder || 1);
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : "");
      setEndDate(initialData.endDate ? initialData.endDate.slice(0, 10) : "");
      setImagePreview(initialData.imageUrl || "");
      setImageError(false);
      setMobileImagePreview(initialData.mobileImageUrl || "");
      setMobileImageError(false);
      setImageFile(null);
      setMobileImageFile(null);
    } else {
      setTitle("");
      setSubTitle("");
      setTargetUrl("");
      setButtonText("Şimdi Keşfet");
      setDisplayOrder(1);
      setStartDate("");
      setEndDate("");
      setImageFile(null);
      setImagePreview("");
      setImageError(false);
      setMobileImageFile(null);
      setMobileImagePreview("");
      setMobileImageError(false);
    }
  }, [initialData, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageError(false);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileImageFile(file);
      setMobileImageError(false);
      setMobileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: title.trim(),
      subTitle: subTitle.trim(),
      targetUrl: targetUrl.trim(),
      buttonText: buttonText.trim(),
      displayOrder: Number(displayOrder) || 1,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    };

    if (imageFile) payload.image = imageFile;
    if (mobileImageFile) payload.mobileImage = mobileImageFile;

    if (initialData) {
      payload.id = initialData.id;
      payload.imageUrl = initialData.imageUrl;
      payload.mobileImageUrl = initialData.mobileImageUrl;
    }

    onSubmit(payload);
  };

  const desktopSrc = imageFile ? imagePreview : getMinioUrl(imagePreview);
  const mobileSrc = mobileImageFile ? mobileImagePreview : getMinioUrl(mobileImagePreview);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            {initialData ? "Slider / Banner Düzenle" : "Yeni Slider / Banner Ekle"}
          </DialogTitle>
          <DialogDescription>
            Ana sayfa vitrininde gösterilecek banner görselini ve yönlendirme bağlantılarını ayarlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Görsel Yükleme Alanı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">Masaüstü Görsel {!initialData && <span className="text-destructive">*</span>}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:bg-muted/40 transition">
                {desktopSrc && !imageError ? (
                  <div className="space-y-2">
                    <img
                      src={desktopSrc}
                      alt="Banner Preview"
                      onError={() => setImageError(true)}
                      className="w-full h-32 object-cover rounded-md border bg-muted"
                    />
                    <Label htmlFor="image" className="cursor-pointer text-xs text-primary underline block">
                      Görseli Değiştir
                    </Label>
                  </div>
                ) : (
                  <label htmlFor="image" className="cursor-pointer flex flex-col items-center py-6 space-y-1.5">
                    {imageError ? (
                      <AlertCircle className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {imageError ? "Mevcut görsel bulunamadı (Tıklayıp yeni yükleyin)" : "Banner görseli seçin"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">1920x800 önerilir</span>
                  </label>
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required={!initialData && !imagePreview}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileImage">Mobil Görsel (Opsiyonel)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:bg-muted/40 transition">
                {mobileSrc && !mobileImageError ? (
                  <div className="space-y-2">
                    <img
                      src={mobileSrc}
                      alt="Mobile Banner Preview"
                      onError={() => setMobileImageError(true)}
                      className="w-full h-32 object-cover rounded-md border bg-muted"
                    />
                    <Label htmlFor="mobileImage" className="cursor-pointer text-xs text-primary underline block">
                      Mobil Görseli Değiştir
                    </Label>
                  </div>
                ) : (
                  <label htmlFor="mobileImage" className="cursor-pointer flex flex-col items-center py-6 space-y-1.5">
                    {mobileImageError ? (
                      <AlertCircle className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {mobileImageError ? "Mobil görsel bulunamadı (Tıklayıp yeni yükleyin)" : "Mobil görsel seçin"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">800x1000 önerilir</span>
                  </label>
                )}
                <Input
                  id="mobileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleMobileImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Ana Başlık</Label>
              <Input
                id="title"
                placeholder="Örn: Yeni Sezon Trendleri"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subTitle">Alt Başlık</Label>
              <Input
                id="subTitle"
                placeholder="Örn: %40'a varan indirimleri kaçırmayın"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="targetUrl">Yönlendirme Linki (URL)</Label>
              <Input
                id="targetUrl"
                placeholder="Örn: /kategori/tisort veya https://..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buttonText">Buton Metni</Label>
              <Input
                id="buttonText"
                placeholder="Örn: Alışverişe Başla"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder">Gösterim Sırası</Label>
              <Input
                id="displayOrder"
                type="number"
                min={1}
                placeholder="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="h-9 text-center text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
                "Slider Ekle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
