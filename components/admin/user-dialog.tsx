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
import { User, UserDto } from "@/hooks/useUsers";
import { User as UserIcon } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: User | null;
  isPending: boolean;
  onSubmit: (data: any) => void;
}

export function UserDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: UserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobilePhones, setMobilePhones] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || initialData.FullName || "");
      setEmail(initialData.email || initialData.Email || "");
      setMobilePhones(initialData.mobilePhones || initialData.MobilePhones || "");
      setPassword("");
    } else {
      setFullName("");
      setEmail("");
      setMobilePhones("");
      setPassword("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      fullName: fullName.trim(),
      email: email.trim(),
      mobilePhones: mobilePhones.trim() || undefined,
    };

    if (initialData) {
      payload.userId = initialData.userId ?? initialData.UserId ?? initialData.id;
    } else {
      payload.password = password;
      payload.status = true;
      payload.citizenId = 0;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {initialData ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
          <DialogDescription>
            Kullanıcı hesap bilgilerini tanımlayın ve güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullname">Ad Soyad <span className="text-destructive">*</span></Label>
            <Input
              id="fullname"
              placeholder="Örn: Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="Örn: ahmet@hakanwear.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input
              id="phone"
              placeholder="Örn: 05xx xxx xx xx"
              value={mobilePhones}
              onChange={(e) => setMobilePhones(e.target.value)}
            />
          </div>

          {!initialData && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

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
                "Kullanıcı Ekle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
