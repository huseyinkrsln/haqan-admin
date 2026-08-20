import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/api.types";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get<Category[]>("/api/categories/getall");
      return res.data;
    },
  });
}

export function useRootCategoryLookup() {
  return useQuery<{ id: number; name: string }[]>({
    queryKey: ["categories-lookup-root"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/categories/lookup?onlyRoot=true");
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return list.map((item: any) => ({
        id: Number(item.id ?? item.Id),
        name: item.label ?? item.Label ?? item.name ?? item.Name,
      }));
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => {
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
      return axiosInstance.post("/api/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateCategoryDto) => {
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
      return axiosInstance.put("/api/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/categories", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
