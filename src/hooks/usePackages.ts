import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { packageService } from "@/services/productService";

import type { CreatePackagePayload, UpdatePackagePayload } from "@/types/product.types";

export function usePackages(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["packages", filters],
    queryFn: () => packageService.getAll(filters),
  });
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ["packages", id],
    queryFn: () => packageService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePackagePayload) => packageService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePackagePayload }) =>
      packageService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["packages"] });
      void queryClient.invalidateQueries({ queryKey: ["packages", id] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["packages"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}