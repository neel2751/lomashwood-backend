import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { blogService } from "@/services/blogService";

import type { CreateBlogPostPayload, UpdateBlogPostPayload } from "@/types/content.types";

type BlogFilters = Record<string, unknown>;

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
    mutationFn: (payload: CreateBlogPostPayload) => blogService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBlogPostPayload }) =>
      blogService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["blogs"] });
      void queryClient.invalidateQueries({ queryKey: ["blogs", id] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });
}