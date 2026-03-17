import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { brochureService } from "@/services/brochureService";
import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

import type {
  BrochureFilterParams,
  BrochureRequestFilterParams,
  CreateBrochurePayload,
  UpdateBrochurePayload,
} from "@/types/content.types";

export function useBrochures(filters?: BrochureFilterParams) {
  return useQuery({
    queryKey: ["brochures", filters],
    queryFn: () => fetchWithAuth(`/api/brochures${buildQueryString(filters || {})}`),
  });
}

export function useBrochure(id: string) {
  return useQuery({
    queryKey: ["brochures", id],
    queryFn: () => fetchWithAuth(`/api/brochures/${id}`),
    enabled: !!id,
  });
}

export function useCreateBrochure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrochurePayload) => brochureService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brochures"] });
    },
  });
}

export function useUpdateBrochure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrochurePayload }) =>
      brochureService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: UpdateBrochurePayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["brochures"] });
      void queryClient.invalidateQueries({ queryKey: ["brochures", id] });
    },
  });
}

export function useDeleteBrochure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brochureService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brochures"] });
    },
  });
}

export function useBrochureRequests(filters?: BrochureRequestFilterParams) {
  return useQuery({
    queryKey: ["brochure-requests", filters],
    queryFn: () => fetchWithAuth(`/api/brochures/requests${buildQueryString(filters || {})}`),
  });
}

export function useBrochureRequest(id: string) {
  return useQuery({
    queryKey: ["brochure-requests", id],
    queryFn: () => fetchWithAuth(`/api/brochures/requests/${id}`),
    enabled: !!id,
  });
}
