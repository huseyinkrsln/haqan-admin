import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Color, CreateColorDto, UpdateColorDto } from "@/types/api.types";

export function useColors() {
  return useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      const res = await axiosInstance.get<Color[]>("/api/colors/getall");
      return res.data;
    },
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateColorDto) => axiosInstance.post("/api/colors", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
    },
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateColorDto) => axiosInstance.put("/api/colors", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
    },
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/colors", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
    },
  });
}
