import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { SizeGroup, CreateSizeGroupDto, UpdateSizeGroupDto, Size } from "@/types/api.types";

export function useSizeGroups() {
  return useQuery<SizeGroup[]>({
    queryKey: ["size-groups"],
    queryFn: async () => {
      const res = await axiosInstance.get<SizeGroup[]>("/api/sizegroups/getall");
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data || [];
    },
  });
}

export function useSizeGroupById(id?: number) {
  return useQuery<SizeGroup>({
    queryKey: ["size-group", id],
    queryFn: async () => {
      const res = await axiosInstance.get<SizeGroup>(`/api/sizegroups/getbyid?id=${id}`);
      const raw = res.data;
      return (raw as any)?.data || raw;
    },
    enabled: Boolean(id && id > 0),
  });
}

export function useSizesBySizeGroupId(sizeGroupId?: number) {
  return useQuery<Size[]>({
    queryKey: ["sizes-by-group", sizeGroupId],
    queryFn: async () => {
      const res = await axiosInstance.get<Size[]>(`/api/sizes/getbysizegroupid?sizeGroupId=${sizeGroupId}`);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data || [];
    },
    enabled: Boolean(sizeGroupId && sizeGroupId > 0),
  });
}

export function useCreateSizeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSizeGroupDto) => axiosInstance.post("/api/sizegroups", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-groups"] });
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}

export function useUpdateSizeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSizeGroupDto) => axiosInstance.put("/api/sizegroups", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-groups"] });
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}

export function useDeleteSizeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/sizegroups", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-groups"] });
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}
