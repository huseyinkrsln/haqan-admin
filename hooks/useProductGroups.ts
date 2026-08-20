import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { ProductGroup, CreateProductGroupDto, UpdateProductGroupDto } from "@/types/api.types";
import { toast } from "sonner";

export function useProductGroups(categoryId?: number) {
  return useQuery<ProductGroup[]>({
    queryKey: ["product-groups", categoryId],
    queryFn: async () => {
      const url = categoryId
        ? `/api/productgroups/getall?categoryId=${categoryId}`
        : "/api/productgroups/getall";
      const res = await axiosInstance.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
    enabled: categoryId === undefined || categoryId > 0,
  });
}

export function useCreateProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductGroupDto) => {
      const formData = new FormData();
      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      const res = await axiosInstance.post("/api/productgroups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
      if (vars.categoryId) {
        queryClient.invalidateQueries({ queryKey: ["product-groups", vars.categoryId] });
      }
      toast.success("Ürün grubu başarıyla eklendi.");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.Message ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Ürün grubu eklenirken bir hata oluştu.";
      toast.error(msg);
    },
  });
}

export function useUpdateProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateProductGroupDto) => {
      const formData = new FormData();
      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      const res = await axiosInstance.put("/api/productgroups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
      if (vars.categoryId) {
        queryClient.invalidateQueries({ queryKey: ["product-groups", vars.categoryId] });
      }
      toast.success("Ürün grubu başarıyla güncellendi.");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.Message ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Ürün grubu güncellenirken bir hata oluştu.";
      toast.error(msg);
    },
  });
}

export function useDeleteProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosInstance.delete("/api/productgroups", {
        data: { id },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
      toast.success("Ürün grubu silindi.");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.Message ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Ürün grubu silinirken bir hata oluştu.";
      toast.error(msg);
    },
  });
}
