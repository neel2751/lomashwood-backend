import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/services/blogService";
import type { BlogFilters, CreateBlogPayload, UpdateBlogPayload } from "@/types/content.types";

export function useBlogs(filters?: BlogFilters) {
  return useQuery({
    queryKey: ["blogs", filters],
    queryFn: () => blogService.getAll(filters),
  });
}

export function useBlog(id: string) {
  return useQuery({
    queryKey: ["blogs", id],
    queryFn: () => blogService.getById(id),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBlogPayload) => blogService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBlogPayload }) =>
      blogService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", id] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}