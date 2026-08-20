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
