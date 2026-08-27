import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Coupon, CreateCouponDto, UpdateCouponDto, PaginatedResult } from "@/types/api.types";

export function useCoupons(
  page: number = 1,
  take: number = 50,
  search?: string,
  discountType?: string
) {
  return useQuery<PaginatedResult<Coupon[]> | Coupon[]>({
    queryKey: ["coupons", page, take, search, discountType],
    queryFn: async () => {
      let url = `/api/coupons/getall?page=${page}&take=${take}&orderBy=Id&isAscending=false`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (discountType && discountType !== "all") {
        url += `&discountType=${encodeURIComponent(discountType)}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
  });
}

export function useCoupon(id?: number) {
  return useQuery<Coupon>({
    queryKey: ["coupon", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/coupons/getbyid?id=${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCouponDto) => axiosInstance.post("/api/coupons", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateCouponDto) => axiosInstance.put("/api/coupons", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupon"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/coupons/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
