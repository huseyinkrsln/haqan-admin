"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Save,
  KeyRound,
} from "lucide-react";
import { useUsers, useUserDetail, useChangePassword } from "@/hooks/useUsers";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const sessionUser = session?.user as any;
  const userId = sessionUser?.id ? Number(sessionUser.id) : undefined;
  const role = sessionUser?.role || "SUPER_ADMIN";

  // Profil Bilgileri Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobilePhones, setMobilePhones] = useState("");

  // Şifre Değiştirme Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Queries & Mutations
  const { data: userDetail, isLoading: loadingDetail, refetch } = useUserDetail(userId);
  const { updateMutation } = useUsers();
  const changePasswordMutation = useChangePassword();

  // Load initial data
  useEffect(() => {
    if (userDetail && Object.keys(userDetail).length > 0) {
      setFullName(userDetail.fullName || userDetail.FullName || sessionUser?.name || "");
      setEmail(userDetail.email || userDetail.Email || sessionUser?.email || "");
      setMobilePhones(userDetail.mobilePhones || userDetail.MobilePhones || "");
    } else if (sessionUser) {
      setFullName(sessionUser.name || sessionUser.fullName || "");
      setEmail(sessionUser.email || "");
    }
  }, [userDetail, sessionUser]);

  // Profil Bilgilerini Güncelle
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Ad Soyad ve E-posta alanları zorunludur.");
      return;
    }

    const payload = {
      userId: userId || userDetail?.userId || userDetail?.UserId,
      fullName: fullName.trim(),
      email: email.trim(),
      mobilePhones: mobilePhones.trim(),
    };

    updateMutation.mutate(payload, {
      onSuccess: async () => {
        refetch();
        // NextAuth session güncelle
        if (updateSession) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              name: fullName.trim(),
              fullName: fullName.trim(),
              email: email.trim(),
            },
          });
        }
      },
    });
  };

  // Şifreyi Güncelle
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Lütfen yeni şifrenizi girin.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakterden oluşmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    const targetUserId = userId || userDetail?.userId || userDetail?.UserId;
    if (!targetUserId) {
      toast.error("Kullanıcı ID tespit edilemedi.");
      return;
    }

    changePasswordMutation.mutate(
      {
        userId: targetUserId,
        password: newPassword,
      },
      {
        onSuccess: () => {
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  };

  const displayName = fullName || sessionUser?.name || "Yönetici";
  const displayEmail = email || sessionUser?.email || "-";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profilim</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Profil Başlık Kartı */}
      <div className="bg-card border rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-background shrink-0">
            {initials}
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
              <Badge variant="default" className="text-xs font-mono">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                {role}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{displayEmail}</span>
              </div>
              {mobilePhones && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{mobilePhones}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* İki Kolonlu Form Alanı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Profil Bilgilerini Düzenleme */}
        <div className="bg-card border rounded-xl p-6 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
              <UserIcon className="h-4 w-4 text-primary" />
              Kişisel Bilgiler
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ad, soyad ve iletişim bilgilerinizi güncelleyin.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-fullname">
                Ad Soyad <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-fullname"
                  className="pl-9 h-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ad Soyad"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-email">
                E-posta <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-email"
                  type="email"
                  className="pl-9 h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@haqanwear.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Telefon Numarası</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-phone"
                  className="pl-9 h-10"
                  value={mobilePhones}
                  onChange={(e) => setMobilePhones(e.target.value)}
                  placeholder="05xx xxx xx xx"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                {updateMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-1" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Bilgileri Güncelle
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Şifre Değiştirme Formu */}
        <div className="bg-card border rounded-xl p-6 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
              <KeyRound className="h-4 w-4 text-amber-500" />
              Şifre Değiştir
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">
                Yeni Şifre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  className="pl-9 pr-9 h-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">
                Yeni Şifre (Tekrar) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pl-9 pr-9 h-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni şifreyi tekrar girin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-1" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Şifreyi Değiştir
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
