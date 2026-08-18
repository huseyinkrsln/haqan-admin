import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { ProductFavorite, PaginatedResult } from "@/types/api.types";

export function useFavorites(page: number = 1, take: number = 10, search?: string) {
  return useQuery<PaginatedResult<ProductFavorite[]> | ProductFavorite[]>({
    queryKey: ["favorites", page, take, search],
    queryFn: async () => {
      let url = `/api/productfavorites/getall?page=${page}&take=${take}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await axiosInstance.get(url);
      return res.data;
    },
  });
}
