import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold font-playfair text-destructive">Unauthorized</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You do not have the required permissions to view this page. If you believe this is an error, please contact a Super Admin.
      </p>
      <Button asChild>
        <Link href="/admin/products">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
