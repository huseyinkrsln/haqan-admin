import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Feature, CreateFeatureDto, UpdateFeatureDto } from "@/types/api.types";

export function useFeatures() {
  return useQuery<Feature[]>({
    queryKey: ["features"],
    queryFn: async () => {
      const res = await axiosInstance.get<Feature[]>("/api/features/getall");
      return res.data;
    },
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFeatureDto) => {
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
      return axiosInstance.post("/api/features", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateFeatureDto) => {
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
      return axiosInstance.put("/api/features", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/features", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}
