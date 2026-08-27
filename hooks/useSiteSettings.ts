import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  SiteSetting,
  CreateSiteSettingDto,
  UpdateSiteSettingDto,
  BulkUpdateSiteSettingDto,
} from "@/types/api.types";

export function useSiteSettings() {
  return useQuery<SiteSetting[]>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get<SiteSetting[]>("/api/SiteSettings/getall");
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data || [];
    },
  });
}

export function useSiteSettingsByGroup(groupKey?: string) {
  return useQuery<SiteSetting[]>({
    queryKey: ["site-settings-group", groupKey],
    queryFn: async () => {
      if (!groupKey) return [];
      const res = await axiosInstance.get<SiteSetting[]>(`/api/SiteSettings/getbygroup?groupKey=${encodeURIComponent(groupKey)}`);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data || [];
    },
    enabled: !!groupKey,
  });
}

export function useSiteSettingsDictionary() {
  return useQuery<Record<string, string>>({
    queryKey: ["site-settings-dictionary"],
    queryFn: async () => {
      const res = await axiosInstance.get<Record<string, string>>("/api/SiteSettings/getpublicdictionary");
      const raw = res.data;
      return (raw as any)?.data || raw || {};
    },
  });
}

export function useCreateSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteSettingDto) =>
      axiosInstance.post("/api/SiteSettings", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-group"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-dictionary"] });
    },
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSiteSettingDto) =>
      axiosInstance.put("/api/SiteSettings", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-group"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-dictionary"] });
    },
  });
}

export function useBulkUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkUpdateSiteSettingDto) =>
      axiosInstance.put("/api/SiteSettings/bulkupdate", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-group"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-dictionary"] });
    },
  });
}

export function useDeleteSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/SiteSettings", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-group"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-dictionary"] });
    },
  });
}

export function useSoftDeleteSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/SiteSettings/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-group"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-dictionary"] });
    },
  });
}
