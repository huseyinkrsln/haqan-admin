"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleLogin = (role: string) => {
    signIn("credentials", { role, callbackUrl: "/admin/products" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-sm border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a mock role below to test RBAC features.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Button
            onClick={() => handleLogin("SUPER_ADMIN")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            Login as Super Admin
          </Button>
          <Button
            onClick={() => handleLogin("EDITOR")}
            className="w-full"
            variant="outline"
            size="lg"
          >
            Login as Editor
          </Button>
          <Button
            onClick={() => handleLogin("VIEWER")}
            className="w-full"
            variant="secondary"
            size="lg"
          >
            Login as Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}
