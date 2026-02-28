import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleService } from "@/services/roleService";
import type { CreateRolePayload, UpdateRolePayload } from "@/types/auth.types";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getAll(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      roleService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}