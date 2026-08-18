import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { PaginatedResult } from "@/types/api.types";

export interface User {
  id?: number;
  userId?: number;
  UserId?: number;
  fullName?: string;
  FullName?: string;
  email?: string;
  Email?: string;
  mobilePhones?: string;
  MobilePhones?: string;
  status?: boolean;
  Status?: boolean;
}

export type UserDto = User;

export function useUsers(page: number = 1, take: number = 10, search?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedResult<User[]> | User[]>({
    queryKey: ["users", page, take, search],
    queryFn: async () => {
      let url = `/api/v1/users?page=${page}&take=${take}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.post("/api/v1/users", {
        fullName: data.fullName || data.FullName,
        email: data.email || data.Email,
        mobilePhones: data.mobilePhones || data.MobilePhones || "",
        password: data.password || data.Password,
        status: data.status ?? true,
        citizenId: 0,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı başarıyla eklendi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data?.message || err.response?.data || "Kullanıcı eklenirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        userId: data.userId ?? data.UserId ?? data.id,
        fullName: data.fullName || data.FullName,
        email: data.email || data.Email,
        mobilePhones: data.mobilePhones || data.MobilePhones || "",
      };
      const res = await axiosInstance.put("/api/v1/users", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı başarıyla güncellendi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data?.message || err.response?.data || "Kullanıcı güncellenirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosInstance.delete(`/api/v1/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı silindi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.Message || err.response?.data?.message || err.response?.data || "Kullanıcı silinirken hata oluştu.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  return {
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
