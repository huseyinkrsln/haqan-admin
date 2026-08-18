import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { StockMovement, PaginatedResult } from "@/types/api.types";

export function useStockMovements(
  page: number = 1,
  take: number = 50,
  search?: string,
  movementType?: string,
  variantId?: number
) {
  return useQuery<PaginatedResult<StockMovement[]> | StockMovement[]>({
    queryKey: ["stock-movements", page, take, search, movementType, variantId],
    queryFn: async () => {
      let url = `/api/stockmovements/getall?page=${page}&take=${take}&orderBy=Id&isAscending=false`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (movementType && movementType !== "all") {
        url += `&movementType=${encodeURIComponent(movementType)}`;
      }
      if (variantId && variantId > 0) {
        url += `&productVariantId=${variantId}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
  });
}
