import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Role = {
  id: string;
  name: string;
  description?: string;
};

type RolesResponse = {
  data: Role[];
  meta: {
    total: number;
  };
};

type RoleFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

const roleService = {
  getAll: async (_filters?: RoleFilters): Promise<RolesResponse> => ({
    data: [],
    meta: { total: 0 },
  }),
  getById: async (_id: string): Promise<Role | null> => null,
  create: async (_payload: Record<string, unknown>): Promise<Role | null> => null,
  update: async (_id: string, _payload: Record<string, unknown>): Promise<Role | null> => null,
  remove: async (_id: string): Promise<void> => {},
};

export function useRoles(filters?: RoleFilters) {
  return useQuery<RolesResponse>({
    queryKey: ["roles", filters],
    queryFn: () => roleService.getAll(filters),
  });
}

export function useRole(id: string) {
  return useQuery<Role | null>({
    queryKey: ["roles", id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => roleService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      roleService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}