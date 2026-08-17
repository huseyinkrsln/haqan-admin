import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export interface User {
  UserId: number;
  FullName: string;
  Email: string;
  MobilePhones?: string;
  Status: boolean;
}

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axiosInstance.get<User[]>("/api/v1/users");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<User, "UserId" | "Status"> & { Password?: string }) => {
      const res = await axiosInstance.post("/api/v1/users", { ...data, Status: true, CitizenId: 0 });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı eklendi.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.Message || "Kullanıcı eklenirken hata oluştu.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: User) => {
      const res = await axiosInstance.put("/api/v1/users", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı güncellendi.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.Message || "Kullanıcı güncellenirken hata oluştu.");
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
      toast.error(err.response?.data?.Message || "Kullanıcı silinirken hata oluştu.");
    },
  });

  return {
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
