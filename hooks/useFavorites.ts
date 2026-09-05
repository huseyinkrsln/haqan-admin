import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  ProductFavorite,
  OutfitFavorite,
  FavoriteCounts,
  PaginatedResult,
} from "@/types/api.types";

interface UseFavoritesOptions {
  enabled?: boolean;
}

export function useFavorites(
  page: number = 1,
  take: number = 10,
  search?: string,
  options?: UseFavoritesOptions
) {
  return useQuery<PaginatedResult<ProductFavorite[]> | ProductFavorite[]>({
    queryKey: ["favorites", page, take, search],
    queryFn: async () => {
      try {
        let url = `/api/productfavorites/getall?page=${page}&take=${take}`;
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }
        const res = await axiosInstance.get(url);
        return res.data;
      } catch (err: any) {
        console.warn("Ürün favorileri yüklenirken hata:", err?.response?.status || err);
        return { data: [], totalRecords: 0, totalPages: 1 };
      }
    },
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useOutfitFavorites(
  page: number = 1,
  take: number = 10,
  search?: string,
  options?: UseFavoritesOptions
) {
  return useQuery<PaginatedResult<OutfitFavorite[]> | OutfitFavorite[]>({
    queryKey: ["outfit-favorites", page, take, search],
    queryFn: async () => {
      try {
        let url = `/api/outfitfavorites/getall?page=${page}&take=${take}`;
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }
        const res = await axiosInstance.get(url);
        return res.data;
      } catch (err: any) {
        console.warn("Kombin favorileri yüklenirken hata:", err?.response?.status || err);
        return { data: [], totalRecords: 0, totalPages: 1 };
      }
    },
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/**
 * Ürün ve Kombin favori sayaçlarını backend'den hızlı ve izole şekilde çeken metod.
 */
export function useFavoriteCounts() {
  return useQuery<FavoriteCounts>({
    queryKey: ["favorite-counts"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/api/productfavorites/counts");
        const data = res.data;
        return {
          productFavoritesCount: Number(
            data?.productFavoritesCount ?? data?.ProductFavoritesCount ?? 0
          ),
          outfitFavoritesCount: Number(
            data?.outfitFavoritesCount ?? data?.OutfitFavoritesCount ?? 0
          ),
          totalCount: Number(data?.totalCount ?? data?.TotalCount ?? 0),
        };
      } catch (err: any) {
        console.warn("Favori sayaçları alınamadı:", err);
        return {
          productFavoritesCount: 0,
          outfitFavoritesCount: 0,
          totalCount: 0,
        };
      }
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });
}
