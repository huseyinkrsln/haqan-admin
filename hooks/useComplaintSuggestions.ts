import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { 
  ComplaintSuggestion, 
  ComplaintSuggestionPaginationResponse,
  FeedbackType, 
  FeedbackStatus, 
  UpdateComplaintSuggestionStatusDto 
} from "@/types/api.types";

interface GetComplaintSuggestionsParams {
  page?: number;
  take?: number;
  search?: string;
  type?: FeedbackType | number;
  processStatus?: FeedbackStatus | number;
}

export function useComplaintSuggestions(params?: GetComplaintSuggestionsParams) {
  return useQuery<ComplaintSuggestionPaginationResponse>({
    queryKey: [
      "complaint-suggestions",
      params?.page ?? 1,
      params?.take ?? 10,
      params?.search ?? "",
      params?.type,
      params?.processStatus,
    ],
    queryFn: async () => {
      const res = await axiosInstance.get<ComplaintSuggestionPaginationResponse>("/api/ComplaintSuggestions/getall", {
        params: {
          page: params?.page ?? 1,
          take: params?.take ?? 10,
          search: params?.search ? params.search.trim() : undefined,
          type: params?.type,
          processStatus: params?.processStatus,
        },
      });
      const data = res.data;
      return (data as any)?.data || data;
    },
  });
}

export function useComplaintSuggestionStats() {
  return useQuery<ComplaintSuggestionStats>({
    queryKey: ["complaint-suggestion-stats"],
    queryFn: async () => {
      const res = await axiosInstance.get<ComplaintSuggestionStats>("/api/ComplaintSuggestions/stats");
      const data = res.data;
      return (data as any)?.data || data;
    },
  });
}

export function useComplaintSuggestionById(id: number | null) {
  return useQuery<ComplaintSuggestion>({
    queryKey: ["complaint-suggestion", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const res = await axiosInstance.get<ComplaintSuggestion>(`/api/ComplaintSuggestions/getbyid?id=${id}`);
      return (res.data as any)?.data || res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateComplaintSuggestionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateComplaintSuggestionStatusDto) =>
      axiosInstance.put("/api/ComplaintSuggestions/updatestatus", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestion"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestion-stats"] });
    },
  });
}

export function useDeleteComplaintSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/ComplaintSuggestions/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestion-stats"] });
    },
  });
}

export function useSoftDeleteComplaintSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete("/api/ComplaintSuggestions/softdelete", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-suggestions"] });
    },
  });
}
