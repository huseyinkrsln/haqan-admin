import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Size, CreateSizeDto, UpdateSizeDto } from "@/types/api.types";

export function useSizes() {
  return useQuery<Size[]>({
    queryKey: ["sizes"],
    queryFn: async () => {
      const res = await axiosInstance.get<Size[]>("/api/sizes/getall");
      return res.data;
    },
  });
}

export function useCreateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSizeDto) => axiosInstance.post("/api/sizes", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}

export function useUpdateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSizeDto) => axiosInstance.put("/api/sizes", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/sizes", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}
