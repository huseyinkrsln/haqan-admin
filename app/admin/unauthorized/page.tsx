import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold text-destructive">Yetkisiz Erişim</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Bu sayfayı görüntüleme yetkiniz yok. Daha fazla erişim iznine ihtiyacınız olduğunu düşünüyorsanız yöneticinizle iletişime geçin.
      </p>
      <Button render={<Link href="/admin/products" />}>
        Ürünlere Dön
      </Button>
    </div>
  );
}