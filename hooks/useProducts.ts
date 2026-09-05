import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "@/lib/axios";
import {
  Product,
  PaginatedResult,
  CreateComplexProductDto,
  UpdateProductDto,
  ProductVariant,
  ProductImage,
  ProductColor,
  ProductPickerDto,
} from "@/types/api.types";

interface UseProductsParams {
  page?: number;
  take?: number;
  orderBy?: string;
  isAscending?: boolean;
  search?: string;
  categoryId?: number;
  brandId?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

// ─── Liste ────────────────────────────────────────────────────────────────────

export function useProducts(params: UseProductsParams = {}) {
  const {
    page = 1,
    take = 10,
    orderBy = "Id",
    isAscending = false,
    search,
    categoryId,
    brandId,
    isFeatured,
    isNewArrival,
  } = params;

  return useQuery<PaginatedResult<Product[]>>({
    queryKey: ["products", page, take, orderBy, isAscending, search, categoryId, brandId, isFeatured, isNewArrival],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResult<Product[]>>(
        "/api/products/getall",
        {
          params: {
            page,
            take,
            orderBy,
            isAscending,
            search: search?.trim() || undefined,
            categoryId,
            brandId,
            isFeatured,
            isNewArrival,
          },
        }
      );
      return res.data;
    },
  });
}

// ─── Tekil ────────────────────────────────────────────────────────────────────

export function useProductById(id: number) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await axiosInstance.get<Product>("/api/products/getbyid", {
        params: { id },
      });
      return res.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateComplexProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateComplexProductDto) =>
      axiosInstance.post("/api/products/complex", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateProductDto) =>
      axiosInstance.put("/api/products", dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
  });
}

export function useUpdateProductPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { productId: number; basePrice: number; discountPrice?: number }) =>
      axiosInstance.put("/api/products/update-price", dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/products/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Varyant Hooks ────────────────────────────────────────────────────────────

export function useProductVariantsByProductId(productId: number) {
  return useQuery<ProductVariant[]>({
    queryKey: ["productVariants", productId],
    queryFn: async () => {
      const res = await axiosInstance.get<ProductVariant[]>(
        "/api/productVariants/getbyproductid",
        { params: { productId } }
      );
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      id: number;
      stockQuantity: number;
      priceDifference: number;
      productColorId: number;
      sizeId: number;
      sku?: string;
      barcode?: string;
    }) => axiosInstance.put("/api/productVariants", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
    },
  });
}

export function useAddProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      stockQuantity: number;
      priceDifference: number;
      productColorId: number;
      sizeId: number;
      sku?: string;
      barcode?: string;
    }) => axiosInstance.post("/api/productVariants", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
    },
  });
}

export async function checkBarcodes(barcodes: string[], excludeVariantId?: number): Promise<string[]> {
  const clean = barcodes.filter((b) => b && b.trim() !== "");
  if (clean.length === 0) return [];
  const res = await axiosInstance.post<string[]>("/api/ProductVariants/check-barcodes", {
    barcodes: clean,
    excludeVariantId,
  });
  return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
}

// ─── Görsel Hooks ─────────────────────────────────────────────────────────────

export function useProductImagesByProductId(productId: number) {
  return useQuery<ProductImage[]>({
    queryKey: ["productImages", productId],
    queryFn: async () => {
      const res = await axiosInstance.get<ProductImage[]>(
        "/api/productImages/getbyproductid",
        { params: { productId } }
      );
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useUpdateProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: FormData | {
      id: number;
      productColorId: number;
      displayOrder?: number;
      isMain: boolean;
      isProductMain: boolean;
      file?: File;
      imageUrl?: string;
    }) => {
      let body: FormData;
      if (dto instanceof FormData) {
        body = dto;
      } else {
        body = new FormData();
        body.append("id", String(dto.id));
        body.append("productColorId", String(dto.productColorId));
        body.append("displayOrder", String(dto.displayOrder ?? 0));
        body.append("isMain", String(dto.isMain));
        body.append("isProductMain", String(dto.isProductMain));
        if (dto.imageUrl) body.append("imageUrl", dto.imageUrl);
        if (dto.file) body.append("file", dto.file);
      }
      return axiosInstance.put("/api/productImages", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
    },
  });
}

export function useAddProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      axiosInstance.post("/api/productImages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/productImages", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
    },
  });
}

// ─── ProductColor Hooks ───────────────────────────────────────────────────────

export function useProductColorsByProductId(productId: number) {
  return useQuery<ProductColor[]>({
    queryKey: ["productColors", productId],
    queryFn: async () => {
      const res = await axiosInstance.get<ProductColor[]>(
        "/api/productColors/getbyproductid",
        { params: { productId } }
      );
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useAddProductColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { productId: number; colorId: number }) =>
      axiosInstance.post("/api/productColors", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productColors"] });
    },
  });
}

// ─── Pagination Helper ────────────────────────────────────────────────────────

export function useProductPagination() {
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);

  const goToPage = (newPage: number) => setPage(newPage);
  const goToNext = () => setPage((p) => p + 1);
  const goToPrev = () => setPage((p) => Math.max(1, p - 1));
  const changePageSize = (size: number) => {
    setTake(size);
    setPage(1);
  };

  return { page, take, goToPage, goToNext, goToPrev, changePageSize };
}

// ─── Infinite Scroll Products Picker (for Outfits & Combos) ─────────────────

export function useInfiniteProductsPicker(search?: string, enabled = true) {
  return useInfiniteQuery<PaginatedResult<ProductPickerDto[]>>({
    queryKey: ["products-picker", search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get("/api/products/picker", {
        params: {
          page: pageParam,
          take: 15,
          search: search?.trim() || undefined,
        },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage) return undefined;
      const currentPage = lastPage.pageNumber ?? lastPage.PageNumber ?? lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? lastPage.TotalPages ?? 1;
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
    enabled,
  });
}
