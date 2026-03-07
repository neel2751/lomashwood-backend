import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { colourService } from "@/services/colourService";

import type { CreateColourPayload } from "@/types/product.types";

export function useColours() {
  return useQuery({
    queryKey: ["colors"],
    queryFn: () => colourService.getAll(),
  });
}

export function useColor(id: string) {
  return useQuery({
    queryKey: ["colors", id],
    queryFn: () => colourService.getById(id),
    enabled: !!id,
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateColourPayload) => colourService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["colors"] });
    },
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateColourPayload }) =>
      colourService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: CreateColourPayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["colors"] });
      void queryClient.invalidateQueries({ queryKey: ["colors", id] });
    },
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => colourService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["colors"] });
    },
  });
}