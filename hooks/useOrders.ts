import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Order, OrderItem, UpdateOrderDto, PaginatedResult, OrderCounts, OrderStatusEnum } from "@/types/api.types";

export function useOrders(
  page: number = 1,
  take: number = 50,
  status?: OrderStatusEnum | string | number,
  search?: string
) {
  return useQuery<PaginatedResult<Order[]> | Order[]>({
    queryKey: ["orders", page, take, status, search],
    queryFn: async () => {
      let url = `/api/orders/getall?page=${page}&take=${take}&orderBy=Id&isAscending=false`;
      if (status !== undefined && status !== "all" && status !== "") {
        url += `&status=${encodeURIComponent(status)}`;
      }
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
  });
}

export function useOrderCounts() {
  return useQuery<OrderCounts>({
    queryKey: ["order-counts"],
    queryFn: async () => {
      const res = await axiosInstance.get<OrderCounts>("/api/orders/getcounts");
      return res.data;
    },
  });
}

export function useOrder(id?: number) {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/orders/getbyid?id=${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useOrderItems(orderId?: number) {
  return useQuery<OrderItem[]>({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/orderitems/getall?orderId=${orderId}&take=100`);
      const allItems: OrderItem[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return allItems;
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateOrderDto) => axiosInstance.put("/api/orders", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/orders/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
    },
  });
}
