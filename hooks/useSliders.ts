import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Slider, CreateSliderDto, UpdateSliderDto } from "@/types/api.types";

export function useSliders() {
  return useQuery<Slider[]>({
    queryKey: ["sliders"],
    queryFn: async () => {
      const res = await axiosInstance.get<Slider[]>("/api/sliders/getall");
      return res.data;
    },
  });
}

export function useCreateSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSliderDto) => {
      const formData = new FormData();
      if (dto.title) formData.append("title", dto.title);
      if (dto.subTitle) formData.append("subTitle", dto.subTitle);
      if (dto.targetUrl) formData.append("targetUrl", dto.targetUrl);
      if (dto.buttonText) formData.append("buttonText", dto.buttonText);
      formData.append("displayOrder", String(dto.displayOrder || 0));
      if (dto.startDate) formData.append("startDate", dto.startDate);
      if (dto.endDate) formData.append("endDate", dto.endDate);
      if (dto.image) formData.append("image", dto.image);
      if (dto.mobileImage) formData.append("mobileImage", dto.mobileImage);

      return axiosInstance.post("/api/sliders", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}

export function useUpdateSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSliderDto) => {
      const formData = new FormData();
      formData.append("id", String(dto.id));
      if (dto.title) formData.append("title", dto.title);
      if (dto.subTitle) formData.append("subTitle", dto.subTitle);
      if (dto.targetUrl) formData.append("targetUrl", dto.targetUrl);
      if (dto.buttonText) formData.append("buttonText", dto.buttonText);
      formData.append("displayOrder", String(dto.displayOrder || 0));
      if (dto.startDate) formData.append("startDate", dto.startDate);
      if (dto.endDate) formData.append("endDate", dto.endDate);
      if (dto.imageUrl) formData.append("imageUrl", dto.imageUrl);
      if (dto.mobileImageUrl) formData.append("mobileImageUrl", dto.mobileImageUrl);
      if (dto.image) formData.append("image", dto.image);
      if (dto.mobileImage) formData.append("mobileImage", dto.mobileImage);

      return axiosInstance.put("/api/sliders", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}

export function useDeleteSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete("/api/sliders", { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}
