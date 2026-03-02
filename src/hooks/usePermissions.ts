import { useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/utils/permission-helpers";
import type { UserWithRole } from "@/utils/permission-helpers";
import type { PermissionKey, RoleName } from "@/lib/constants";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const userWithRole: UserWithRole | null = user?.roleName
    ? { id: user.id, role: user.roleName as RoleName }
    : null;

  const can = useCallback(
    (permission: PermissionKey): boolean => {
      if (!userWithRole) return false;
      return hasPermission(userWithRole, permission);
    },
    [userWithRole]
  );

  const canAny = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!userWithRole) return false;
      return hasAnyPermission(userWithRole, permissions);
    },
    [userWithRole]
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!userWithRole) return false;
      return hasAllPermissions(userWithRole, permissions);
    },
    [userWithRole]
  );

  const isAdmin = userWithRole?.role === "admin" || userWithRole?.role === "super_admin";
  const isStaff = userWithRole?.role === "manager" || userWithRole?.role === "consultant";

  return { can, canAny, canAll, isAdmin, isStaff, role: userWithRole?.role ?? null };
}