import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { ShippingCarrier } from "@/types/api.types";

export function useShippingCarriers(search?: string) {
  return useQuery<ShippingCarrier[]>({
    queryKey: ["shipping-carriers", search],
    queryFn: async () => {
      let url = "/api/shippingcarriers/getall";
      if (search && search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`;
      }
      const res = await axiosInstance.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
  });
}

export function useCreateShippingCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<ShippingCarrier>) => axiosInstance.post("/api/shippingcarriers", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
    },
  });
}

export function useUpdateShippingCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<ShippingCarrier>) => axiosInstance.put("/api/shippingcarriers", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
    },
  });
}

export function useDeleteShippingCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/shippingcarriers", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
    },
  });
}
