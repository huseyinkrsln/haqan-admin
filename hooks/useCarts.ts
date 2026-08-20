import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Cart, CartItem, PaginatedResult } from "@/types/api.types";
import { toast } from "sonner";

export function useCarts(page: number = 1, take: number = 10, search?: string) {
  return useQuery<PaginatedResult<Cart[]> | Cart[]>({
    queryKey: ["carts", page, take, search],
    queryFn: async () => {
      let url = `/api/carts/getall?page=${page}&take=${take}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
    staleTime: 0,
  });
}

export function useCartItems(cartId?: number) {
  return useQuery<CartItem[]>({
    queryKey: ["cart-items", cartId],
    queryFn: async () => {
      if (!cartId) return [];
      const res = await axiosInstance.get(`/api/cartitems/getall?cartId=${cartId}`);
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data;
    },
    enabled: !!cartId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useDeleteCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/carts", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carts"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("Sepet silindi.");
    },
    onError: (err: any) => {
      toast.error("Sepet silinirken hata oluştu.");
    },
  });
}
