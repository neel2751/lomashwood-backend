import { useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/utils/permission-helpers";

type PermissionKey = Parameters<typeof hasPermission>[1];

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;

  const can = useCallback(
    (permission: PermissionKey): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    [role]
  );

  const canAny = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!role) return false;
      return hasAnyPermission(role, permissions);
    },
    [role]
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!role) return false;
      return hasAllPermissions(role, permissions);
    },
    [role]
  );

  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  return { can, canAny, canAll, isAdmin, isStaff, role };
}