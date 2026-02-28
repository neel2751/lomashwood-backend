import { useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { PERMISSIONS } from "@/config/permissions";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/utils/permission-helpers";
import type { Permission } from "@/types/auth.types";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false;
      return hasPermission(role, permission, PERMISSIONS);
    },
    [role]
  );

  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAnyPermission(role, permissions, PERMISSIONS);
    },
    [role]
  );

  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAllPermissions(role, permissions, PERMISSIONS);
    },
    [role]
  );

  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  return { can, canAny, canAll, isAdmin, isStaff, role };
}