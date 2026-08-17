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

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "color" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
}

interface GenericCrudDialogProps<T extends { id?: number }> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initialData?: T | null;
  isPending?: boolean;
  onSubmit: (data: Omit<T, "id">) => void;
}

export function GenericCrudDialog<T extends { id?: number }>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialData,
  isPending,
  onSubmit,
}: GenericCrudDialogProps<T>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      fields.forEach((f) => {
        init[f.key] = initialData
          ? String((initialData as any)[f.key] ?? "")
          : "";
      });
      setValues(init);
      // focus ilk input
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v.trim()])
    );
    onSubmit(payload as Omit<T, "id">);
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {fields.map((field, idx) => (
            <div key={field.key} className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor={field.key} className="text-right text-sm">
                {field.label}
              </Label>
              {field.type === "color" ? (
                <div className="col-span-3 flex items-center gap-2">
                  <div className="relative shrink-0 w-10 h-10 overflow-hidden rounded-md border border-input shadow-sm">
                    <input
                      type="color"
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                      value={values[field.key]?.startsWith("#") ? values[field.key] : "#000000"}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value.toUpperCase() }))
                      }
                      disabled={isPending}
                      title="Renk Seç"
                    />
                  </div>
                  <Input
                    id={field.key}
                    ref={idx === 0 ? firstInputRef : undefined}
                    type="text"
                    placeholder={field.placeholder ?? "#000000"}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="flex-1 uppercase"
                    required={field.required !== false}
                    disabled={isPending}
                  />
                </div>
              ) : field.type === "select" ? (
                <select
                  id={field.key}
                  ref={idx === 0 ? firstInputRef : undefined}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  required={field.required !== false}
                  disabled={isPending}
                >
                  <option value="" disabled={field.required}>
                    {field.placeholder || "Seçiniz..."}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.key}
                  ref={idx === 0 ? firstInputRef : undefined}
                  type={field.type || "text"}
                  placeholder={field.placeholder ?? ""}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="col-span-3"
                  required={field.required !== false}
                  disabled={isPending}
                />
              )}
            </div>
          ))}

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
                <>
                  <Spinner size="sm" className="mr-2" />
                  {initialData ? "Güncelleniyor..." : "Kaydediliyor..."}
                </>
              ) : initialData ? (
                "Güncelle"
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
