import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Role, OperationClaim } from "@/types/api.types";
import { toast } from "sonner";

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/groups");
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
  });
}

export function useOperationClaims() {
  return useQuery<OperationClaim[]>({
    queryKey: ["operation-claims"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/operation-claims");
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
  });
}

export function useGroupClaims(groupId?: number) {
  return useQuery<{ id: string; label: string }[]>({
    queryKey: ["group-claims", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await axiosInstance.get(`/api/v1/group-claims/groups/${groupId}`);
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
    enabled: !!groupId,
  });
}

export function useUpdateGroupClaims() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, claimIds }: { groupId: number; claimIds: number[] }) => {
      const res = await axiosInstance.put("/api/v1/group-claims", {
        id: 0,
        groupId,
        claimIds,
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["group-claims", vars.groupId] });
      toast.success("Rol izinleri başarıyla güncellendi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data || "İzinler güncellenirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { groupName: string }) => axiosInstance.post("/api/v1/groups", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla eklendi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data || "Rol eklenirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { id: number; groupName: string }) => axiosInstance.put("/api/v1/groups", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla güncellendi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data || "Rol güncellenirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/api/v1/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol silindi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data || "Rol silinirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });
}
