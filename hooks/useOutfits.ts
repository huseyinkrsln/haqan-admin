import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export interface ProductOutfitInfo {
  outfitId: number;
  outfitTitle: string;
  outfitSlug?: string;
  coverImageUrl?: string;
  outfitCoverImageUrl?: string;
  currentOutfitPrice: number;
  totalOriginalPrice?: number;
  currentItemsTotalPrice?: number;
  itemCount?: number;
  totalPiecesCount?: number;
  isActive?: boolean;
}

export interface BulkUpdateOutfitPriceItem {
  outfitId: number;
  newPrice: number;
}

export function useOutfitsByProductId(productId: number | undefined, enabled: boolean = false) {
  return useQuery<ProductOutfitInfo[]>({
    queryKey: ["outfitsByProduct", productId],
    queryFn: async () => {
      if (!productId) return [];
      const res = await axiosInstance.get(`/api/Outfits/getbyproductid?productId=${productId}`);
      const rawData = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(rawData) ? rawData : [];
      return list.map((item: any) => {
        const coverImg = item.outfitCoverImageUrl || item.coverImageUrl || "";
        const originalPrice = Number(item.currentItemsTotalPrice ?? item.totalOriginalPrice ?? 0);
        const count = Number(item.totalPiecesCount ?? item.itemCount ?? 0);
        const outfitPrice = Number(item.currentOutfitPrice ?? item.price ?? 0);
        return {
          outfitId: Number(item.outfitId ?? item.id),
          outfitTitle: item.outfitTitle ?? item.title ?? "",
          outfitSlug: item.outfitSlug ?? item.slug ?? "",
          coverImageUrl: coverImg,
          outfitCoverImageUrl: coverImg,
          currentOutfitPrice: outfitPrice,
          totalOriginalPrice: originalPrice,
          currentItemsTotalPrice: originalPrice,
          itemCount: count,
          totalPiecesCount: count,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        };
      });
    },
    enabled: enabled && !!productId && productId > 0,
  });
}

export function useBulkUpdateOutfitPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: BulkUpdateOutfitPriceItem[]) => {
      const res = await axiosInstance.put("/api/Outfits/bulkupdateprices", { outfits: updates });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["outfitsByProduct"] });
    },
  });
}

export function useUpdateOutfitPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, price }: { id: number; price: number }) => {
      const res = await axiosInstance.put("/api/Outfits/update-price", { id, price });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["outfitsByProduct"] });
    },
  });
}

