import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type User = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName?: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
};

type UsersResponse = {
  data: User[];
  meta: {
    total: number;
    roles: { id: string; name: string }[];
  };
};

type UserFilters = {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

const userService = {
  getAll: (_filters?: UserFilters): Promise<UsersResponse> =>
    Promise.resolve({ data: [], meta: { total: 0, roles: [] } }),
  getById: (_id: string): Promise<User | null> =>
    Promise.resolve(null),
  create: (_payload: Record<string, unknown>): Promise<User | null> =>
    Promise.resolve(null),
  update: (_id: string, _payload: Record<string, unknown>): Promise<User | null> =>
    Promise.resolve(null),
  remove: (_id: string): Promise<void> =>
    Promise.resolve(),
  updateStatus: (_id: string, _status: string): Promise<void> =>
    Promise.resolve(),
};

export function useUsers(filters?: UserFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<UsersResponse>({
    queryKey: ["users", filters],
    queryFn: () => userService.getAll(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      userService.updateStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return {
    ...query,
    deleteUser: (id: string) => deleteMutation.mutateAsync(id),
    updateUserStatus: (id: string, status: string) =>
      statusMutation.mutateAsync({ id, status }),
  };
}

export function useUser(id?: string) {
  return useQuery<User | null>({
    queryKey: ["users", id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => userService.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      userService.update(id, data),
    onSuccess: (_data: unknown, { id }: { id: string; data: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}