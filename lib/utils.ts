import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || "http://127.0.0.1:9000";

export function getMinioUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  return `${MINIO_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function getCategoryBreadcrumb(category: any, allCategories: any[] = []): string {
  if (!category) return "";
  const name = category.name || category.Name || "";
  const parentId = category.parentCategoryId ?? category.ParentCategoryId;

  if (!parentId || Number(parentId) === 0) {
    return name;
  }

  const parent = allCategories.find((c: any) => Number(c.id ?? c.Id) === Number(parentId));
  if (parent) {
    return `${getCategoryBreadcrumb(parent, allCategories)} > ${name}`;
  }

  return name;
}

export function getApiErrorMessage(err: any, fallback = "İşlem sırasında bir hata oluştu."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === "string") return data;
  if (data.Message) return data.Message;
  if (data.message) return data.message;
  if (data.errors && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
      return data.errors[firstKey][0];
    }
  }
  return fallback;
}
