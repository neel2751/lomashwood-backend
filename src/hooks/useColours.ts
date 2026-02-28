import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colourService } from "@/services/colourService";
import type { CreateColourPayload, UpdateColourPayload } from "@/types/product.types";

export function useColours() {
  return useQuery({
    queryKey: ["colours"],
    queryFn: () => colourService.getAll(),
  });
}

export function useColour(id: string) {
  return useQuery({
    queryKey: ["colours", id],
    queryFn: () => colourService.getById(id),
    enabled: !!id,
  });
}

export function useCreateColour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateColourPayload) => colourService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colours"] });
    },
  });
}

export function useUpdateColour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateColourPayload }) =>
      colourService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["colours"] });
      queryClient.invalidateQueries({ queryKey: ["colours", id] });
    },
  });
}

export function useDeleteColour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => colourService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colours"] });
    },
  });
}